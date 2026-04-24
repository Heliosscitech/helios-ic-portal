import { useEffect, useRef, useState } from 'react';

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

const SAME_TAB_EVENT = 'helios:persistent-state-change';
let instanceCounter = 0;

/**
 * Senkron yaz + aynı tab'daki tüm hook instance'larını bilgilendir.
 * Hook dışından (ör. unmount olan modal içinde) kullanılmak üzere.
 */
export function writePersistedState<T>(key: string, value: T): void {
  writeLocal(key, value);
  window.dispatchEvent(
    new CustomEvent(SAME_TAB_EVENT, {
      detail: { key, value, sourceId: -1 },
    })
  );
}

interface SameTabDetail {
  key: string;
  value: unknown;
  sourceId: number;
}

export function usePersistentState<T>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const instanceIdRef = useRef<number | null>(null);
  if (instanceIdRef.current === null) instanceIdRef.current = ++instanceCounter;
  const instanceId = instanceIdRef.current;

  const [state, setState] = useState<T>(() => readLocal<T>(key, initial));
  const suppressNextWrite = useRef(false);

  useEffect(() => {
    if (suppressNextWrite.current) {
      suppressNextWrite.current = false;
      return;
    }
    writeLocal(key, state);
    window.dispatchEvent(
      new CustomEvent<SameTabDetail>(SAME_TAB_EVENT, {
        detail: { key, value: state, sourceId: instanceId },
      })
    );
  }, [key, state, instanceId]);

  useEffect(() => {
    const storageHandler = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        suppressNextWrite.current = true;
        setState(JSON.parse(e.newValue) as T);
      } catch {
        /* ignore */
      }
    };
    const sameTabHandler = (e: Event) => {
      const ce = e as CustomEvent<SameTabDetail>;
      if (!ce.detail || ce.detail.key !== key || ce.detail.sourceId === instanceId) return;
      suppressNextWrite.current = true;
      setState(ce.detail.value as T);
    };
    window.addEventListener('storage', storageHandler);
    window.addEventListener(SAME_TAB_EVENT, sameTabHandler);
    return () => {
      window.removeEventListener('storage', storageHandler);
      window.removeEventListener(SAME_TAB_EVENT, sameTabHandler);
    };
  }, [key, instanceId]);

  return [state, setState];
}
