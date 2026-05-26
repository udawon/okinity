import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { site } from '@/config/site.config';
import Container from './Container';

export default async function Footer() {
  const t = await getTranslations('footer');

  return (
    <footer className="mt-20 border-t border-white/10 bg-black/25 backdrop-blur-sm">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Image
            src="/brand/logo-white.png"
            alt={site.name}
            width={819}
            height={235}
            className="h-9 w-auto"
          />
          <p className="mt-2 text-sm text-white/55">{site.address}</p>
          <p className="mt-1 text-xs text-white/45">
            {t('rights', { year: new Date().getFullYear() })}
          </p>
          {site.padiAffiliated && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#5fd6e2]">
              PADI Dive Center
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 text-sm text-white/55">
          <span className="font-semibold text-white">{t('contactUs')}</span>
          <a href={`mailto:${site.contact.email}`} className="hover:text-white">
            {site.contact.email}
          </a>
          {site.contact.instagram && (
            <a
              href={site.contact.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Instagram
            </a>
          )}
        </div>
      </Container>
    </footer>
  );
}
