import { randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { insertWithSchemaFallback } from '@/lib/db-errors';
import type { Inquiry, InquirySource, InquiryStatus, InquiryStore, NewInquiry } from './types';

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
  email: string | null;
  contact: string;
  message: string | null;
  status: string;
  note: string | null;
  scheduled_time: string | null;
  source_first?: string | null;
  source_last?: string | null;
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
    scheduledTime: r.scheduled_time ?? undefined,
    sourceFirst: r.source_first ?? undefined,
    sourceLast: r.source_last ?? undefined
  };
}

function client() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다. (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  return sb;
}

export const supabaseStore: InquiryStore = {
  async create(input: NewInquiry, source?: InquirySource): Promise<Inquiry> {
    const row: Record<string, unknown> = {
      id: randomUUID(),
      product: input.product ?? null,
      date: input.date ?? null,
      time: input.time ?? null,
      people: input.people ?? null,
      name: input.name,
      email: input.email || null,
      contact: input.contact,
      message: input.message ?? null,
      status: 'tentative',
      ...(source?.sourceFirst ? { source_first: source.sourceFirst } : {}),
      ...(source?.sourceLast ? { source_last: source.sourceLast } : {})
    };
    // 유입처 칸이 아직 없으면(docs/supabase-geo-tracking.sql 실행 전) 유입처 없이 다시 저장 — 문의 유실 방지
    const { data, error } = await insertWithSchemaFallback(
      (r) => client().from(TABLE).insert(r).select('*').single(),
      row,
      ['source_first', 'source_last']
    );
    if (error || !data) throw new Error(`예약 저장 실패: ${(error as { message?: string } | null)?.message ?? 'no data'}`);
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

  async updateScheduledTime(id: string, time: string): Promise<boolean> {
    const { data, error } = await client()
      .from(TABLE)
      .update({ scheduled_time: time.trim() || null })
      .eq('id', id)
      .select('id');
    if (error) throw new Error(`배정 시각 저장 실패: ${error.message}`);
    return (data?.length ?? 0) > 0;
  },

  async update(id: string, input: NewInquiry): Promise<boolean> {
    const { data, error } = await client()
      .from(TABLE)
      .update({
        product: input.product ?? null,
        date: input.date ?? null,
        time: input.time ?? null,
        people: input.people ?? null,
        name: input.name,
        email: input.email || null,
        contact: input.contact,
        message: input.message ?? null
      })
      .eq('id', id)
      .select('id');
    if (error) throw new Error(`예약 수정 실패: ${error.message}`);
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
