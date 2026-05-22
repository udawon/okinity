import { getTranslations } from 'next-intl/server';
import { site } from '@/config/site.config';
import Container from './Container';

export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <Container className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-bold text-ink">{site.name}</p>
          <p className="mt-1 text-sm text-muted">
            {t('rights', { year: new Date().getFullYear() })}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-muted">
          <span className="font-medium text-ink">{t('contactUs')}</span>
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
