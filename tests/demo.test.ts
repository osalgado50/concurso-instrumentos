import { describe, it, expect } from 'vitest';
import { seedDemo, clearAll, autoSeedIfEmpty, getDemoState } from '../src/lib/demo';
import {
  getParticipants,
  getConsents,
  getDraws,
  getAudit,
  addParticipant,
  normalizeEmail,
} from '../src/lib/store';
import { performDraw } from '../src/lib/draw';
import { confirmDeadline } from '../src/lib/state';
import { isValidPhone } from '../src/lib/store';

const now = new Date('2026-10-15T12:00:00-07:00');

describe('datos de demostración', () => {
  it('carga inscripciones ficticias coherentes (únicas, con consentimientos y teléfonos válidos)', () => {
    const n = seedDemo(now);
    const ps = getParticipants();
    expect(ps).toHaveLength(n);
    expect(new Set(ps.map((p) => p.emailKey)).size).toBe(n);
    expect(ps.every((p) => p.emailKey === normalizeEmail(p.email))).toBe(true);
    expect(ps.some((p) => p.status === 'pendiente')).toBe(true);
    expect(ps.some((p) => p.status === 'confirmado')).toBe(true);
    expect(ps.filter((p) => p.status === 'confirmado').every((p) => p.confirmedAt)).toBe(true);
    expect(ps.every((p) => !p.telefono || isValidPhone(p.telefono))).toBe(true);
    expect(ps.every((p) => new Date(p.createdAt) <= now)).toBe(true);

    const cs = getConsents();
    expect(cs).toHaveLength(n);
    expect(cs.every((c) => c.bases.accepted && c.bases.version)).toBe(true);
    expect(cs.some((c) => c.comms.accepted)).toBe(true);
    expect(cs.some((c) => !c.comms.accepted)).toBe(true);

    expect(getDraws()).toHaveLength(0);
    expect(getAudit().some((a) => a.action === 'demo')).toBe(true);
    expect(getDemoState()).toBe('seeded');
  });

  it('los datos de ejemplo bloquean duplicados y permiten hacer un sorteo', async () => {
    seedDemo(now);
    const r = addParticipant(
      { nombre: 'Otra', email: 'ANA.LOPEZ@ejemplo.mx ', telefono: '', consentBases: true, commsOptIn: false },
      now,
    );
    expect(r.ok).toBe(false);
    const after = new Date(confirmDeadline().getTime() + 1000);
    const d = await performDraw(after);
    expect(d.ok).toBe(true);
    if (d.ok) {
      const pend = getParticipants().filter((p) => p.status === 'pendiente').map((p) => p.id);
      expect(pend.includes(d.draw.winnerId)).toBe(false);
    }
  });

  it('se carga sola solo la primera vez y nunca tras "Borrar todo"', () => {
    expect(autoSeedIfEmpty(now)).toBe(true);
    expect(getParticipants().length).toBeGreaterThan(0);
    clearAll();
    expect(getParticipants()).toHaveLength(0);
    expect(getConsents()).toHaveLength(0);
    expect(getAudit()).toHaveLength(0);
    expect(getDemoState()).toBe('cleared');
    expect(autoSeedIfEmpty(now)).toBe(false);
    expect(getParticipants()).toHaveLength(0);
  });

  it('no se carga sola si ya hay inscripciones reales', () => {
    addParticipant(
      { nombre: 'Real Persona', email: 'real@ejemplo.mx', telefono: '', consentBases: true, commsOptIn: false },
      now,
    );
    expect(autoSeedIfEmpty(now)).toBe(false);
    expect(getParticipants()).toHaveLength(1);
  });
});
