import { translationEnabled } from '@/lib/translate';

/**
 * 언어 탭 안내 — 한국어 기준 자동 번역(lib/content-sync-server)이 어떻게 동작하는지 편집 화면에서 알려준다.
 * 서버 컴포넌트(키 설정 여부를 서버에서만 확인).
 */
export default function AutoTranslateNote({ lang, className = '' }: { lang: string; className?: string }) {
  const on = translationEnabled();
  let text: string;
  if (lang === 'ko') {
    text = on
      ? '한국어를 저장하면 English·日本語가 한국어 기준으로 자동 번역됩니다(바뀐 칸만). 번역하는 동안 저장이 최대 1분 걸릴 수 있어요.'
      : '자동 번역이 꺼져 있습니다(번역 API 키 미설정). 한국어를 저장해도 English·日本語는 바뀌지 않아요.';
  } else {
    const name = lang === 'en' ? 'English' : '日本語';
    text = `${name} 번역을 직접 고치는 화면입니다. ${
      on ? '한국어를 저장하면 이 언어는 자동으로 다시 번역되고, 여기서 고쳐 저장한 칸은 그 칸의 한국어가 바뀌기 전까지 유지됩니다. ' : ''
    }사진·가격 숫자·순서·공개 여부는 한국어 탭에서 정합니다.`;
  }
  return <p className={`rounded-card border border-line bg-bg/40 p-3 text-xs text-muted ${className}`}>{text}</p>;
}
