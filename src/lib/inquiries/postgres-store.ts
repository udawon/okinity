import { randomUUID } from 'node:crypto';
import { sql } from '@vercel/postgres';
import type { Inquiry, InquiryStatus, InquiryStore, NewInquiry } from './types';

/**
 * Postgres 기반 저장소 — 프로덕션(Vercel/Neon/Supabase 등)용.
 * POSTGRES_URL 환경변수를 @vercel/postgres가 자동 사용한다.
 * 첫 호출 시 테이블을 없으면 생성한다(간단한 마이그레이션).
 */
let initialized = false;

async function ensureTable(): Promise<void> {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS inquiries (
      id          TEXT PRIMARY KEY,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      product     TEXT,
      date        TEXT,
      time        TEXT,
      people      INTEGER,
      name        TEXT NOT NULL,
      email       TEXT,
      contact     TEXT NOT NULL,
      message     TEXT,
      status      TEXT NOT NULL DEFAULT 'tentative',
      note        TEXT
    )
  `;
  // 기존 테이블 호환: 없으면 컬럼 추가
  await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS note TEXT`;
  await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS time TEXT`;
  await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS scheduled_time TEXT`;
  await sql`ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS email TEXT`;
  initialized = true;
}

type Row = {
  id: string;
  created_at: string | Date;
  product: string | null;
  date: string | null;
  time: string | null;
  people: number | null;
  name: string;
  email: string | null;
  contact: string;
  message: string | null;
  status: string;
  note: string | null;
  scheduled_time: string | null;
};

function toInquiry(r: Row): Inquiry {
  return {
    id: r.id,
    createdAt: new Date(r.created_at).toISOString(),
    product: r.product ?? undefined,
    date: r.date ?? undefined,
    time: r.time ?? undefined,
    people: r.people ?? undefined,
    name: r.name,
    email: r.email ?? undefined,
    contact: r.contact,
    message: r.message ?? undefined,
    status: r.status as InquiryStatus,
    note: r.note ?? undefined,
    scheduledTime: r.scheduled_time ?? undefined
  };
}

export const postgresStore: InquiryStore = {
  async create(input: NewInquiry): Promise<Inquiry> {
    await ensureTable();
    const id = randomUUID();
    const { rows } = await sql<Row>`
      INSERT INTO inquiries (id, product, date, time, people, name, email, contact, message, status)
      VALUES (${id}, ${input.product ?? null}, ${input.date ?? null}, ${input.time ?? null},
              ${input.people ?? null}, ${input.name}, ${input.email || null}, ${input.contact},
              ${input.message ?? null}, 'tentative')
      RETURNING *
    `;
    return toInquiry(rows[0]);
  },

  async list(): Promise<Inquiry[]> {
    await ensureTable();
    const { rows } = await sql<Row>`SELECT * FROM inquiries ORDER BY created_at DESC`;
    return rows.map(toInquiry);
  },

  async updateStatus(id: string, status: InquiryStatus): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await sql`
      UPDATE inquiries SET status = ${status} WHERE id = ${id}
    `;
    return (rowCount ?? 0) > 0;
  },

  async updateScheduledTime(id: string, time: string): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await sql`
      UPDATE inquiries SET scheduled_time = ${time.trim() || null} WHERE id = ${id}
    `;
    return (rowCount ?? 0) > 0;
  },

  async update(id: string, input: NewInquiry): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await sql`
      UPDATE inquiries SET
        product = ${input.product ?? null}, date = ${input.date ?? null},
        time = ${input.time ?? null}, people = ${input.people ?? null},
        name = ${input.name}, email = ${input.email || null},
        contact = ${input.contact}, message = ${input.message ?? null}
      WHERE id = ${id}
    `;
    return (rowCount ?? 0) > 0;
  },

  async updateNote(id: string, note: string): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await sql`
      UPDATE inquiries SET note = ${note.trim() || null} WHERE id = ${id}
    `;
    return (rowCount ?? 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await sql`DELETE FROM inquiries WHERE id = ${id}`;
    return (rowCount ?? 0) > 0;
  }
};
