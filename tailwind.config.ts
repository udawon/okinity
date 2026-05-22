import type { Config } from 'tailwindcss';
import { design } from './src/config/design.config';

export default {
  content: ['./src/**/*.{ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: design.colors.brand,
        accent: design.colors.accent,
        ink: design.colors.ink,
        muted: design.colors.muted,
        line: design.colors.line,
        surface: design.colors.surface,
        bg: design.colors.bg
      },
      borderRadius: {
        card: design.radius.card,
        button: design.radius.button
      },
      boxShadow: {
        card: design.shadow.card,
        hover: design.shadow.hover
      },
      maxWidth: {
        container: design.container.max
      },
      fontFamily: {
        // 제목=세리프, 본문/UI=모노. sans는 모노로 별칭(잔여 font-sans 사용처 대비).
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        sans: ['var(--font-mono)', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config;
