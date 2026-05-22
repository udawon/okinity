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
      people      INTEGER,
      name        TEXT NOT NULL,
      contact     TEXT NOT NULL,
      message     TEXT,
      status      TEXT NOT NULL DEFAULT 'new'
    )
  `;
  initialized = true;
}

type Row = {
  id: string;
  created_at: string | Date;
  product: string | null;
  date: string | null;
  people: number | null;
  name: string;
  contact: string;
  message: string | null;
  status: string;
};

function toInquiry(r: Row): Inquiry {
  return {
    id: r.id,
    createdAt: new Date(r.created_at).toISOString(),
    product: r.product ?? undefined,
    date: r.date ?? undefined,
    people: r.people ?? undefined,
    name: r.name,
    contact: r.contact,
    message: r.message ?? undefined,
    status: r.status as InquiryStatus
  };
}

export const postgresStore: InquiryStore = {
  async create(input: NewInquiry): Promise<Inquiry> {
    await ensureTable();
    const id = randomUUID();
    const { rows } = await sql<Row>`
      INSERT INTO inquiries (id, product, date, people, name, contact, message, status)
      VALUES (${id}, ${input.product ?? null}, ${input.date ?? null},
              ${input.people ?? null}, ${input.name}, ${input.contact},
              ${input.message ?? null}, 'new')
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
  }
};
