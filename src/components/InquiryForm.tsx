'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

type Status = 'idle' | 'submitting' | 'success' | 'error';

type ProductOption = { slug: string; title: string };

export default function InquiryForm({ products }: { products: ProductOption[] }) {
  const t = useTranslations('contact.form');
  const [status, setStatus] = useState<Status>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('request failed');
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  const labelCls = 'block text-sm font-medium text-ink';
  const inputCls =
    'mt-1 w-full rounded-button border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {/* 허니팟 — 사람에겐 보이지 않고 봇만 채운다. 채워지면 서버가 무시. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="product" className={labelCls}>
          {t('product')}
        </label>
        <select id="product" name="product" className={inputCls} defaultValue="">
          <option value="" disabled>
            {t('productPlaceholder')}
          </option>
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className={labelCls}>
            {t('date')}
          </label>
          <input id="date" name="date" type="date" className={inputCls} />
        </div>
        <div>
          <label htmlFor="people" className={labelCls}>
            {t('people')}
          </label>
          <input
            id="people"
            name="people"
            type="number"
            min={1}
            defaultValue={1}
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label htmlFor="name" className={labelCls}>
          {t('name')} *
        </label>
        <input id="name" name="name" type="text" required className={inputCls} />
      </div>

      <div>
        <label htmlFor="contact" className={labelCls}>
          {t('contact')} *
        </label>
        <input id="contact" name="contact" type="text" required className={inputCls} />
      </div>

      <div>
        <label htmlFor="message" className={labelCls}>
          {t('message')}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder={t('messagePlaceholder')}
          className={`${inputCls} !rounded-card`}
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-button bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {status === 'submitting' ? t('submitting') : t('submit')}
      </button>

      {status === 'success' && (
        <p role="status" className="rounded-button bg-brand-light px-4 py-3 text-sm text-brand-dark">
          {t('success')}
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="rounded-button bg-red-50 px-4 py-3 text-sm text-red-700">
          {t('error')}
        </p>
      )}
    </form>
  );
}
