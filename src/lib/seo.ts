import type { Metadata } from 'next';
import { site } from '@/config/site.config';
import { routing } from '@/i18n/routing';

/**
 * 페이지별 다국어 canonical + hreflang(ko/en/ja/x-default).
 * 구글에 각 로케일 페이지가 같은 콘텐츠의 언어 변형임을 알려 중복 색인을 방지한다.
 *
 * @param locale 현재 로케일
 * @param path   로케일 뒤 경로. 홈은 '', 그 외 '/about'·'/tours/blue-cave' 처럼 슬래시로 시작.
 */
export function localeAlternates(locale: string, path: string): Metadata['alternates'] {
  const make = (l: string) => `${site.url}/${l}${path}`;
  return {
    canonical: make(locale),
    languages: {
      ko: make('ko'),
      en: make('en'),
      ja: make('ja'),
      'x-default': make(routing.defaultLocale)
    }
  };
}

/**
 * 한국어 전용 페이지(블로그·공지) — EN/JA 주소는 홈으로 넘어가므로 대체 언어를 선언하지 않는다
 * (사이트맵과 같은 신호. 없는 번역본을 hreflang 으로 알리면 검색엔진이 오류로 본다).
 */
export function koOnlyAlternates(path: string): Metadata['alternates'] {
  const ko = `${site.url}/ko${path}`;
  return { canonical: ko, languages: { ko, 'x-default': ko } };
}
