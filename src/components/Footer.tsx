import { getTranslations } from 'next-intl/server';
import { site } from '@/config/site.config';
import Container from './Container';

export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-base font-bold uppercase tracking-[0.12em] text-ink">
            {site.name}
          </p>
          <p className="mt-2 font-mono text-xs tracking-[0.02em] text-muted">
            {site.address}
          </p>
          <p className="mt-1 font-mono text-xs text-muted">
            {t('rights', { year: new Date().getFullYear() })}
          </p>
          {site.padiAffiliated && (
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-brand-dark">
              PADI Dive Center
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 font-mono text-xs text-muted">
          <span className="text-ink">{t('contactUs')}</span>
          <a href={`mailto:${site.contact.email}`} className="hover:text-brand-dark">
            {site.contact.email}
          </a>
          {site.contact.instagram && (
            <a
              href={site.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-dark"
            >
              Instagram
            </a>
          )}
        </div>
      </Container>
    </footer>
  );
}
