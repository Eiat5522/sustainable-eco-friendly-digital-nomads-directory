export type Theme = 'light' | 'dark' | 'system'

export function normalizeTheme(rawValue: string | null | undefined): Theme {
  const candidate = rawValue?.toLowerCase().trim()
  return candidate === 'light' || candidate === 'dark' || candidate === 'system'
    ? (candidate as Theme)
    : 'system'
}

export function themeClass(theme: Theme): string | undefined {
  return theme === 'system' ? undefined : theme
}

export const THEME_INIT_SCRIPT = `(() => {
  try {
    const d = document.documentElement;
    const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
    const t = m ? decodeURIComponent(m[1]).toLowerCase() : 'system';
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = t === 'dark' || (t !== 'light' && prefersDark);
    d.classList.toggle('dark', isDark);
    d.style.colorScheme = isDark ? 'dark' : 'light';
  } catch {}
})();`
