import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { getTheme, setTheme } from "../../lib/dataStore";

export default function ThemeToggle() {
  const [dark, setDark] = useState(getTheme() === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  function toggle() {
    const next = dark ? 'light' : 'dark';
    setDark(!dark);
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}