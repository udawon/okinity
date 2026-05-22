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
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        // 이전 테마의 font-mono 사용처가 산세리프로 렌더되도록 별칭
        mono: ['var(--font-sans)', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
} satisfies Config;
