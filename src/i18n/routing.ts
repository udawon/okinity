import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  // 한·영·일 3개국어. 기본은 한국어.
  locales: ['ko', 'en', 'ja'],
  defaultLocale: 'ko',
  localePrefix: 'always'
});

export type Locale = (typeof routing.locales)[number];

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
