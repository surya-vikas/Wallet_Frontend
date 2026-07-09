export const THEME_STORAGE_KEY = 'theme';
export const LIGHT_THEME_COLOR = '#ffffff';
export const DARK_THEME_COLOR = '#0f1115';

export function getPreferredTheme() {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;

  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }
}

export function setTheme(theme) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  applyTheme(theme);
}
