import { config } from '../config';
import type { Participant, Consent, ParticipantStatus } from '../types';
import {
  getParticipants,
  saveParticipants,
  getConsents,
  saveConsents,
  getDraws,
  getSettings,
  saveSettingsRaw,
  logAudit,
  uid,
  token,
} from './storage';
import { isOpen, isStarted, canConfirm, deadline } from './state';

export { getParticipants, getConsents, getDraws, getSettings, getAudit } from './storage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Normaliza el correo para detectar duplicados: forma Unicode NFKC, sin ningún
 * espacio y en minúsculas. "  Ana@Correo.MX " y "ana@correo.mx" son el mismo.
 */
export function normalizeEmail(email: string): string {
  return email.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
}

export function findParticipant(emailKey: string): Participant | undefined {
  return getParticipants().find((p) => p.emailKey === emailKey);
}

export function findByToken(t: string): Participant | undefined {
  return getParticipants().find((p) => p.token === t);
}

export function consentOf(participantId: string): Consent | undefined {
  return getConsents().find((c) => c.participantId === participantId);
}

/** Cuando ya hay un sorteo, la lista de participantes queda congelada. */
export const isFrozen = () => getDraws().length > 0;

export type AddInput = {
  nombre: string;
  email: string;
  telefono: string;
  consentBases: boolean;
  commsOptIn: boolean;
};

export type AddResult =
  | { ok: true; participant: Participant }
  | {
      ok: false;
      reason: 'not_started' | 'closed' | 'nombre' | 'email' | 'telefono' | 'bases' | 'duplicate';
      status?: ParticipantStatus;
    };

/**
 * Inscribe a un participante. Las reglas se comprueban AQUÍ, en el momento de
 * guardar (no solo al pintar el formulario), así que un formulario que se quedó
 * abierto pasada la hora de cierre ya no puede inscribir a nadie.
 */
export function addParticipant(input: AddInput, now: Date = new Date()): AddResult {
  if (!isStarted(now)) return { ok: false, reason: 'not_started' };
  if (!isOpen(now)) return { ok: false, reason: 'closed' };

  const nombre = input.nombre.trim().replace(/\s+/g, ' ');
  if (nombre.length < 2 || nombre.length > 100) return { ok: false, reason: 'nombre' };

  const email = input.email.trim();
  const emailKey = normalizeEmail(email);
  if (!EMAIL_RE.test(emailKey) || emailKey.length > 255) return { ok: false, reason: 'email' };

  const telefono = input.telefono.trim();
  const digits = telefono.replace(/\D/g, '');
  if (telefono && (digits.length < 10 || digits.length > 13)) return { ok: false, reason: 'telefono' };

  if (!input.consentBases) return { ok: false, reason: 'bases' };

  const all = getParticipants();
  const existing = all.find((p) => p.emailKey === emailKey);
  if (existing) return { ok: false, reason: 'duplicate', status: existing.status };

  const at = now.toISOString();
  const participant: Participant = {
    id: uid(),
    nombre,
    email,
    emailKey,
    telefono,
    createdAt: at,
    confirmedAt: null,
    confirmMethod: null,
    status: 'pendiente',
    token: token(),
  };
  all.push(participant);
  saveParticipants(all);

  // Los consentimientos se guardan aparte, con fecha y versión de las bases.
  const consents = getConsents();
  consents.push({
    participantId: participant.id,
    bases: { accepted: true, at, version: config.basesVersion },
    comms: { accepted: input.commsOptIn, at },
  });
  saveConsents(consents);

  return { ok: true, participant };
}

export type ConfirmResult = 'ok' | 'already' | 'invalid' | 'expired';

/** Confirma el correo con el token del enlace. Pasado el margen posterior al cierre ya no vale. */
export function confirmParticipant(t: string, now: Date = new Date()): ConfirmResult {
  const all = getParticipants();
  const p = t ? all.find((x) => x.token === t) : undefined;
  if (!p) return 'invalid';
  if (p.status === 'confirmado') return 'already';
  if (!canConfirm(now)) return 'expired';
  p.status = 'confirmado';
  p.confirmedAt = now.toISOString();
  p.confirmMethod = 'enlace';
  saveParticipants(all);
  return 'ok';
}

/**
 * Confirmación manual desde el panel. Salta la doble confirmación, así que
 * queda marcada como "manual" en los datos y anotada en el registro de actividad.
 */
export function confirmManually(id: string, now: Date = new Date()): boolean {
  if (isFrozen()) return false;
  const all = getParticipants();
  const p = all.find((x) => x.id === id);
  if (!p || p.status === 'confirmado') return false;
  p.status = 'confirmado';
  p.confirmedAt = now.toISOString();
  p.confirmMethod = 'manual';
  saveParticipants(all);
  logAudit('confirmación manual', `${p.nombre} <${p.email}> confirmado por el administrador`, now);
  return true;
}

export function removeParticipant(id: string, now: Date = new Date()): boolean {
  if (isFrozen()) return false;
  const all = getParticipants();
  const p = all.find((x) => x.id === id);
  if (!p) return false;
  saveParticipants(all.filter((x) => x.id !== id));
  saveConsents(getConsents().filter((c) => c.participantId !== id));
  logAudit('inscripción eliminada', `${p.nombre} <${p.email}> (${p.status})`, now);
  return true;
}

// ---------- Ajustes (todos se anotan en el registro de actividad) ----------

export function setDeadlineOverride(date: Date | null, now: Date = new Date()): boolean {
  if (isFrozen()) return false;
  const s = getSettings();
  const before = deadline().toISOString();
  saveSettingsRaw({ ...s, deadlineOverride: date ? date.toISOString() : undefined });
  logAudit(
    'cambio de fecha de cierre',
    `de ${before} a ${deadline().toISOString()}${date ? '' : ' (vuelve a la fecha de config)'}`,
    now,
  );
  return true;
}

export function closeNow(now: Date = new Date()): boolean {
  if (isFrozen()) return false;
  const s = getSettings();
  if (s.closedAt) return false;
  saveSettingsRaw({ ...s, closedAt: now.toISOString() });
  logAudit('cierre manual', 'inscripciones cerradas desde el panel', now);
  return true;
}

export function reopen(now: Date = new Date()): boolean {
  if (isFrozen()) return false;
  const s = getSettings();
  if (!s.closedAt) return false;
  saveSettingsRaw({ ...s, closedAt: undefined });
  logAudit('reapertura', 'inscripciones reabiertas desde el panel', now);
  return true;
}
