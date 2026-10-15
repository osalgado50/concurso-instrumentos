// Entorno mínimo de navegador para probar la lógica sin DOM.
import { beforeEach } from 'vitest';

const mem = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => (mem.has(k) ? (mem.get(k) as string) : null),
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
  },
  configurable: true,
});

beforeEach(() => mem.clear());
