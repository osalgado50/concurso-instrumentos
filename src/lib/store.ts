import type { Participant, Draw, Settings } from '../types';

const P_KEY = 'concurso.participantes.v1';
const D_KEY = 'concurso.sorteos.v1';
const S_KEY = 'concurso.ajustes.v1';

/** Normaliza el correo para detectar duplicados: quita espacios y pasa a minúsculas. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/\s+/g, '');
}

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
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  ).toUpperCase();
}

export function token(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------- Participantes ----------

export function getParticipants(): Participant[] {
  return read<Participant[]>(P_KEY, []);
}

export function findParticipant(emailKey: string): Participant | undefined {
  return getParticipants().find((p) => p.emailKey === emailKey);
}

export function findByToken(t: string): Participant | undefined {
  return getParticipants().find((p) => p.token === t);
}

/** Devuelve null si el correo ya está inscrito (aunque cambie mayúsculas o espacios). */
export function addParticipant(
  data: Omit<Participant, 'id' | 'createdAt' | 'confirmedAt' | 'status' | 'token' | 'emailKey'>,
): Participant | null {
  const emailKey = normalizeEmail(data.email);
  if (findParticipant(emailKey)) return null;
  const participant: Participant = {
    ...data,
    email: data.email,
    emailKey,
    id: uid(),
    token: token(),
    createdAt: new Date().toISOString(),
    confirmedAt: null,
    status: 'pendiente',
  };
  const all = getParticipants();
  all.push(participant);
  write(P_KEY, all);
  return participant;
}

export function confirmParticipant(t: string): Participant | null {
  const all = getParticipants();
  const p = all.find((x) => x.token === t);
  if (!p) return null;
  if (p.status === 'pendiente') {
    p.status = 'confirmado';
    p.confirmedAt = new Date().toISOString();
    write(P_KEY, all);
  }
  return p;
}

export function updateParticipant(id: string, patch: Partial<Participant>) {
  const all = getParticipants();
  const i = all.findIndex((p) => p.id === id);
  if (i >= 0) {
    all[i] = { ...all[i], ...patch };
    write(P_KEY, all);
  }
}

export function deleteParticipant(id: string) {
  write(P_KEY, getParticipants().filter((p) => p.id !== id));
}

// ---------- Sorteos ----------

export function getDraws(): Draw[] {
  return read<Draw[]>(D_KEY, []);
}

export function addDraw(draw: Draw) {
  const all = getDraws();
  all.push(draw);
  write(D_KEY, all);
}

export function resetDraws() {
  write(D_KEY, []);
}

// ---------- Ajustes ----------

export function getSettings(): Settings {
  return read<Settings>(S_KEY, {});
}

export function saveSettings(s: Settings) {
  write(S_KEY, s);
}

// ---------- Exportación CSV ----------

export function participantsCsv(list: Participant[]): string {
  const headers = [
    'id',
    'nombre',
    'correo',
    'telefono',
    'estado',
    'inscrito',
    'confirmado',
    'acepta_comunicaciones',
  ];
  const rows = list.map((p) =>
    [
      p.id,
      p.nombre,
      p.email,
      p.telefono,
      p.status,
      p.createdAt,
      p.confirmedAt ?? '',
      p.commsOptIn ? 'si' : 'no',
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}
