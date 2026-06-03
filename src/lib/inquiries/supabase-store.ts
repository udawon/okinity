import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Inquiry, InquiryStatus, InquiryStore, NewInquiry } from './types';

/**
 * Supabase(Postgres) 기반 예약 문의 저장소 — 콘텐츠와 동일한 DB로 통합.
 *
 * service_role 키로 RLS를 우회한다(서버 전용). 테이블이 없으면 동작하지 않으므로
 * 최초 1회 Supabase SQL Editor에서 inquiries 테이블을 생성해야 한다
 * (supabase-js는 DDL을 지원하지 않음). 스키마는 docs/supabase-inquiries.sql 참조.
 */
const TABLE = 'inquiries';

type Row = {
  id: string;
  created_at: string;
  product: string | null;
  date: string | null;
  time: string | null;
  people: number | null;
  name: string;
  contact: string;
  message: string | null;
  status: string;
  note: string | null;
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
    contact: r.contact,
    message: r.message ?? undefined,
    status: r.status as InquiryStatus,
    note: r.note ?? undefined
  };
}

function client() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다. (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  return sb;
}

export const supabaseStore: InquiryStore = {
  async create(input: NewInquiry): Promise<Inquiry> {
    const { data, error } = await client()
      .from(TABLE)
      .insert({
        id: randomUUID(),
        product: input.product ?? null,
        date: input.date ?? null,
        time: input.time ?? null,
        people: input.people ?? null,
        name: input.name,
        contact: input.contact,
        message: input.message ?? null,
        status: 'new'
      })
      .select('*')
      .single();
    if (error || !data) throw new Error(`예약 저장 실패: ${error?.message ?? 'no data'}`);
    return toInquiry(data as Row);
  },

  async list(): Promise<Inquiry[]> {
    const { data, error } = await client()
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`예약 조회 실패: ${error.message}`);
    return (data as Row[]).map(toInquiry);
  },

  async updateStatus(id: string, status: InquiryStatus): Promise<boolean> {
    const { data, error } = await client()
      .from(TABLE)
      .update({ status })
      .eq('id', id)
      .select('id');
    if (error) throw new Error(`상태 변경 실패: ${error.message}`);
    return (data?.length ?? 0) > 0;
  },

  async updateNote(id: string, note: string): Promise<boolean> {
    const { data, error } = await client()
      .from(TABLE)
      .update({ note: note.trim() || null })
      .eq('id', id)
      .select('id');
    if (error) throw new Error(`메모 저장 실패: ${error.message}`);
    return (data?.length ?? 0) > 0;
  },

  async delete(id: string): Promise<boolean> {
    const { data, error } = await client()
      .from(TABLE)
      .delete()
      .eq('id', id)
      .select('id');
    if (error) throw new Error(`삭제 실패: ${error.message}`);
    return (data?.length ?? 0) > 0;
  }
};
