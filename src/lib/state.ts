import { config } from '../config';
import { getSettings } from './store';

/** Fecha de cierre efectiva (la del panel manda si se cambió). */
export function deadline(): Date {
  const s = getSettings();
  return new Date(s.deadlineOverride ?? config.endDate);
}

export function isClosed(): boolean {
  const s = getSettings();
  if (s.closedOverride) return true;
  return new Date() > deadline();
}

export function isStarted(): boolean {
  return new Date() >= new Date(config.startDate);
}

export function isOpen(): boolean {
  return isStarted() && !isClosed();
}
