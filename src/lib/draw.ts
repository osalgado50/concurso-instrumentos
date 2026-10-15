import type { Draw } from '../types';
import { getParticipants, getDraws, saveDraws, logAudit, uid } from './storage';
import { drawEnabled } from './state';

export const ALGORITHM =
  'Bombo = ids de confirmados no premiados, ordenados alfabéticamente; índice = crypto.getRandomValues (uint32) con muestreo por rechazo';

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Entero uniforme en [0, n) sin sesgo de módulo. */
export function randomIndex(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % n;
}

type Body = Omit<Draw, 'hash'>;

/** Huella de una selección: cubre todo su contenido y la huella de la anterior. */
function hashDraw(d: Body): Promise<string> {
  return sha256(
    JSON.stringify([
      d.id,
      d.order,
      d.createdAt,
      d.kind,
      d.winnerId,
      d.winnerEmail,
      d.poolSize,
      d.poolIds,
      d.poolHash,
      d.excludedIds,
      d.algorithm,
      d.prevHash,
    ]),
  );
}

export type DrawResult =
  | { ok: true; draw: Draw }
  | { ok: false; reason: 'not_enabled' | 'empty' | 'busy' };

let running = false;

/**
 * Hace una selección al azar entre las inscripciones confirmadas que aún no
 * han salido premiadas. Solo se puede hacer cuando terminó el margen de
 * confirmación. Cada selección queda encadenada con la anterior (huellas).
 */
export async function performDraw(now: Date = new Date()): Promise<DrawResult> {
  if (running) return { ok: false, reason: 'busy' };
  if (!drawEnabled(now)) return { ok: false, reason: 'not_enabled' };
  running = true;
  try {
    const draws = getDraws();
    const winnerIds = new Set(draws.map((d) => d.winnerId));
    const pool = getParticipants()
      .filter((p) => p.status === 'confirmado' && !winnerIds.has(p.id))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (pool.length === 0) return { ok: false, reason: 'empty' };

    const winner = pool[randomIndex(pool.length)];
    const poolIds = pool.map((p) => p.id);
    const order = draws.length + 1;
    const body: Body = {
      id: uid(),
      order,
      createdAt: now.toISOString(),
      kind: order === 1 ? 'ganador' : 'suplente',
      winnerId: winner.id,
      winnerNombre: winner.nombre,
      winnerEmail: winner.email,
      poolSize: pool.length,
      poolIds,
      poolHash: await sha256(poolIds.join('|')),
      excludedIds: [...winnerIds],
      algorithm: ALGORITHM,
      prevHash: draws.length ? draws[draws.length - 1].hash : '',
    };
    const draw: Draw = { ...body, hash: await hashDraw(body) };

    // Se relee justo antes de escribir por si otra pestaña hizo un sorteo mientras tanto.
    const fresh = getDraws();
    if (fresh.length !== draws.length) return { ok: false, reason: 'busy' };
    saveDraws([...fresh, draw]);
    logAudit('sorteo', `${draw.kind} nº ${order}: ${winner.nombre} · huella ${draw.hash.slice(0, 16)}`, now);
    return { ok: true, draw };
  } finally {
    running = false;
  }
}

/** Comprueba que el registro de sorteos no se ha alterado (huellas encadenadas). */
export async function verifyChain(draws: Draw[]): Promise<{ ok: boolean; brokenAt?: number }> {
  let prev = '';
  for (let i = 0; i < draws.length; i++) {
    const { hash, ...body } = draws[i];
    if (body.prevHash !== prev) return { ok: false, brokenAt: i + 1 };
    if ((await hashDraw(body)) !== hash) return { ok: false, brokenAt: i + 1 };
    if ((await sha256(body.poolIds.join('|'))) !== body.poolHash) return { ok: false, brokenAt: i + 1 };
    prev = hash;
  }
  return { ok: true };
}
