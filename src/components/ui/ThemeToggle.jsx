import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, getPreferredTheme, setTheme, THEME_STORAGE_KEY } from '../../utils/theme';

export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(() => getPreferredTheme() === 'dark');

  useEffect(() => {
    setTheme(dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next = event.newValue === 'dark' ? 'dark' : 'light';
      setDark(next === 'dark');
      applyTheme(next);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <button
      onClick={() => setDark((prev) => !prev)}
      className={`fixed bottom-4 left-4 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-lg backdrop-blur transition-colors ${
        dark
          ? 'bg-[#11161f]/90 border-[#232b38] text-slate-100'
          : 'bg-white/90 border-slate-200 text-slate-600'
      } ${className}`}
      aria-label="Toggle theme"
      aria-pressed={dark}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
