import { config } from '../config';

/** Fecha y hora en la zona del concurso (Tijuana), sea cual sea la zona del visitante. */
export function fmt(d: string | number | Date): string {
  return new Date(d).toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: config.timeZone,
  });
}

/** Versión corta para tablas del panel. */
export function fmtShort(d: string | number | Date): string {
  return new Date(d).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: config.timeZone,
  });
}

function parts(date: Date, tz: string): Record<string, number> {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const out: Record<string, number> = {};
  for (const p of dtf.formatToParts(date)) {
    if (p.type !== 'literal') out[p.type] = Number(p.value);
  }
  return out;
}

/** Desfase (ms) de la zona respecto a UTC en un instante dado. */
function offsetMs(date: Date, tz: string): number {
  const p = parts(date, tz);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Instante → valor para <input type="datetime-local"> en la zona del concurso. */
export function toZonedInput(d: Date): string {
  const p = parts(d, config.timeZone);
  const z = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${z(p.month)}-${z(p.day)}T${z(p.hour)}:${z(p.minute)}`;
}

/** Valor de <input type="datetime-local"> (hora de Tijuana) → instante real. */
export function fromZonedInput(v: string): Date {
  const [d, t] = v.split('T');
  const [y, m, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, da, h, mi);
  const first = guess - offsetMs(new Date(guess), config.timeZone);
  // segunda pasada por si el desfase cambia entre el cálculo inicial y el real (cambio de hora)
  return new Date(guess - offsetMs(new Date(first), config.timeZone));
}
