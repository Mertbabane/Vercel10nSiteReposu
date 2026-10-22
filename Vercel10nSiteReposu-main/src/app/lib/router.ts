import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', notify);
}

const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};

export function navigate(path: string) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname + window.location.search !== path) {
    window.history.pushState({}, '', path);
    notify();
  }
  window.scrollTo(0, 0);
}

export function usePathname(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname, () => '/');
}
