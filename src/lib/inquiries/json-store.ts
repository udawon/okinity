import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Inquiry, InquiryStatus, InquiryStore, NewInquiry } from './types';

/**
 * JSON 파일 기반 저장소 — 로컬 개발 / 단일 서버 전용.
 * ⚠ Vercel 등 서버리스의 휘발성 파일시스템에서는 영속되지 않는다.
 *   프로덕션은 POSTGRES_URL을 설정해 Postgres 어댑터를 사용할 것.
 */
const DATA_DIR = path.join(process.cwd(), '.data');
const FILE = path.join(DATA_DIR, 'inquiries.json');

async function readAll(): Promise<Inquiry[]> {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw) as Inquiry[];
  } catch {
    return [];
  }
}

async function writeAll(rows: Inquiry[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), 'utf8');
}

export const jsonStore: InquiryStore = {
  async create(input: NewInquiry): Promise<Inquiry> {
    const rows = await readAll();
    const inquiry: Inquiry = {
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'tentative'
    };
    rows.unshift(inquiry);
    await writeAll(rows);
    return inquiry;
  },

  async list(): Promise<Inquiry[]> {
    const rows = await readAll();
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateStatus(id: string, status: InquiryStatus): Promise<boolean> {
    const rows = await readAll();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rows[idx].status = status;
    await writeAll(rows);
    return true;
  },

  async updateScheduledTime(id: string, time: string): Promise<boolean> {
    const rows = await readAll();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rows[idx].scheduledTime = time.trim() || undefined;
    await writeAll(rows);
    return true;
  },

  async update(id: string, input: NewInquiry): Promise<boolean> {
    const rows = await readAll();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rows[idx] = {
      ...rows[idx],
      product: input.product,
      date: input.date,
      time: input.time,
      people: input.people,
      name: input.name,
      email: input.email,
      contact: input.contact,
      message: input.message
    };
    await writeAll(rows);
    return true;
  },

  async updateNote(id: string, note: string): Promise<boolean> {
    const rows = await readAll();
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    rows[idx].note = note.trim() || undefined;
    await writeAll(rows);
    return true;
  },

  async delete(id: string): Promise<boolean> {
    const rows = await readAll();
    const next = rows.filter((r) => r.id !== id);
    if (next.length === rows.length) return false;
    await writeAll(next);
    return true;
  }
};
