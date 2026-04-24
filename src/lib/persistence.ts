import { useEffect, useState } from 'react';

export const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const writeLocal = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / SSR — yutulur */
  }
};

export function usePersistentState<T>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => readLocal<T>(key, initial));

  useEffect(() => {
    writeLocal(key, state);
  }, [key, state]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        setState(JSON.parse(e.newValue) as T);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [state, setState];
}
