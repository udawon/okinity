'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTourById } from '@/lib/tours';

interface Consultation {
  id: string;
  tourId: string;
  customerName: string;
  customerEmail: string;
  preferredContact: string;
  contactId: string;
  preferredDate: string;
  partySize: number;
  message: string | null;
  language: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  consulting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  pending: '대기',
  consulting: '상담중',
  confirmed: '확정',
  cancelled: '취소',
};

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/consultations', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConsultations(data);
        setAuthenticated(true);
      } else {
        setAuthenticated(false);
        alert('인증 실패');
      }
    } catch {
      alert('서버 오류');
    } finally {
      setLoading(false);
    }
  }, [secret]);

  async function updateStatus(id: string, status: string) {
    await fetch('/api/admin/consultations', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ id, status }),
    });
    fetchConsultations();
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-900">
        <div className="glass rounded-2xl p-8 w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-center">OKINITY Admin</h1>
          <input
            type="password"
            placeholder="Admin Secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchConsultations()}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-white focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={fetchConsultations}
            disabled={loading}
            className="w-full rounded-full bg-teal-500 py-2.5 text-sm font-semibold text-ocean-900 hover:bg-teal-400 disabled:opacity-50"
          >
            {loading ? '...' : '로그인'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ocean-900 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">OKINITY Admin</h1>
          <button
            onClick={fetchConsultations}
            className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-sm text-white/70 hover:text-white hover:border-white/20"
          >
            새로고침
          </button>
        </div>

        <div className="grid gap-4">
          {consultations.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center text-white/40">
              상담 신청이 없습니다
            </div>
          ) : (
            consultations.map((c) => {
              const tour = getTourById(c.tourId);
              return (
                <div key={c.id} className="glass rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold">
                          {c.customerName}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[c.status] || ''}`}
                        >
                          {statusLabels[c.status] || c.status}
                        </span>
                        <span className="text-xs text-white/30">
                          {c.language.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-white/60">
                        <span>📧 {c.customerEmail}</span>
                        <span>
                          💬 {c.preferredContact}: {c.contactId}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-teal-400">
                          {tour?.title.ko || c.tourId}
                        </span>
                        <span className="text-white/60">
                          📅 {c.preferredDate}
                        </span>
                        <span className="text-white/60">
                          👥 {c.partySize}명
                        </span>
                      </div>

                      {c.message && (
                        <p className="text-sm text-white/40 italic">
                          &ldquo;{c.message}&rdquo;
                        </p>
                      )}

                      <p className="text-xs text-white/20">
                        {new Date(c.createdAt).toLocaleString('ko-KR')}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {c.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(c.id, 'consulting')}
                          className="rounded-lg bg-blue-500/20 border border-blue-500/30 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-500/30"
                        >
                          상담 시작
                        </button>
                      )}
                      {(c.status === 'pending' || c.status === 'consulting') && (
                        <>
                          <button
                            onClick={() => updateStatus(c.id, 'confirmed')}
                            className="rounded-lg bg-green-500/20 border border-green-500/30 px-3 py-1.5 text-xs text-green-400 hover:bg-green-500/30"
                          >
                            예약 확정
                          </button>
                          <button
                            onClick={() => updateStatus(c.id, 'cancelled')}
                            className="rounded-lg bg-red-500/20 border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/30"
                          >
                            취소
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
