import type { Participant, Consent, Draw, Settings, AuditEntry } from '../types';

export const KEYS = {
  participants: 'concurso.participantes.v2',
  consents: 'concurso.consentimientos.v2',
  draws: 'concurso.sorteos.v2',
  settings: 'concurso.ajustes.v2',
  audit: 'concurso.auditoria.v2',
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function uid(): string {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).toUpperCase();
}

export function token(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const getParticipants = () => read<Participant[]>(KEYS.participants, []);
export const saveParticipants = (v: Participant[]) => write(KEYS.participants, v);

export const getConsents = () => read<Consent[]>(KEYS.consents, []);
export const saveConsents = (v: Consent[]) => write(KEYS.consents, v);

export const getDraws = () => read<Draw[]>(KEYS.draws, []);
export const saveDraws = (v: Draw[]) => write(KEYS.draws, v);

export const getSettings = () => read<Settings>(KEYS.settings, {});
export const saveSettingsRaw = (v: Settings) => write(KEYS.settings, v);

export const getAudit = () => read<AuditEntry[]>(KEYS.audit, []);

/** Anota una acción del administrador (o del sistema) para poder demostrar qué pasó y cuándo. */
export function logAudit(action: string, detail: string, now = new Date()) {
  const all = getAudit();
  all.push({ id: uid(), at: now.toISOString(), action, detail });
  write(KEYS.audit, all);
}
