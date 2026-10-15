import { config } from '../config';
import { getSettings } from './storage';

/** Fecha de cierre programada (la del panel manda si se cambió). */
export function scheduledDeadline(): Date {
  const s = getSettings();
  return new Date(s.deadlineOverride ?? config.endDate);
}

/** Instante real en que se cierran las inscripciones (el cierre manual adelanta al programado). */
export function deadline(): Date {
  const s = getSettings();
  const scheduled = scheduledDeadline();
  if (s.closedAt) {
    const manual = new Date(s.closedAt);
    return manual < scheduled ? manual : scheduled;
  }
  return scheduled;
}

export const isStarted = (now: Date = new Date()) => now >= new Date(config.startDate);
export const isClosed = (now: Date = new Date()) => now >= deadline();
export const isOpen = (now: Date = new Date()) => isStarted(now) && !isClosed(now);

/** Hasta cuándo se puede confirmar el correo (cierre + margen). */
export function confirmDeadline(): Date {
  return new Date(deadline().getTime() + config.confirmGraceHours * 3600 * 1000);
}

export const canConfirm = (now: Date = new Date()) => now < confirmDeadline();

/** El sorteo solo se habilita cuando termina el margen de confirmación. */
export const drawEnabled = (now: Date = new Date()) => now >= confirmDeadline();
