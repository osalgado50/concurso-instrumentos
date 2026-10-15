import { describe, it, expect } from 'vitest';
import { config } from '../src/config';
import {
  addParticipant,
  confirmParticipant,
  confirmManually,
  removeParticipant,
  setDeadlineOverride,
  closeNow,
  reopen,
  normalizeEmail,
  getParticipants,
  getConsents,
  getDraws,
  getAudit,
} from '../src/lib/store';
import { performDraw, verifyChain } from '../src/lib/draw';
import { deadline, confirmDeadline, drawEnabled } from '../src/lib/state';
import { participantsCsv, csvCell } from '../src/lib/csv';
import { toZonedInput, fromZonedInput } from '../src/lib/time';
import { KEYS } from '../src/lib/storage';

const start = new Date(config.startDate).getTime();
const during = new Date(start + 3600_000);
const end = () => deadline();
const mk = (email: string, extra: Partial<Parameters<typeof addParticipant>[0]> = {}) => ({
  nombre: 'Ana Pérez',
  email,
  telefono: '',
  consentBases: true,
  commsOptIn: false,
  ...extra,
});

function enroll(n: number, confirm = true) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = addParticipant(mk(`persona${i}@ejemplo.mx`, { nombre: `Persona ${i}` }), during);
    if (!r.ok) throw new Error('no se pudo inscribir');
    if (confirm) expect(confirmParticipant(r.participant.token, during)).toBe('ok');
    out.push(r.participant);
  }
  return out;
}

describe('1. un correo solo se inscribe una vez', () => {
  it('detecta duplicados con mayúsculas, espacios y formas Unicode', () => {
    expect(addParticipant(mk('ana@ejemplo.mx'), during).ok).toBe(true);
    for (const v of ['ANA@Ejemplo.MX', '  ana@ejemplo.mx ', 'a n a@ejemplo.mx', 'ａｎａ@ejemplo.mx']) {
      const r = addParticipant(mk(v), during);
      expect(r.ok, v).toBe(false);
      if (!r.ok) expect(r.reason).toBe('duplicate');
    }
    expect(getParticipants()).toHaveLength(1);
    expect(normalizeEmail(' A B@X.com ')).toBe('ab@x.com');
  });

  it('trata como el mismo buzón las variantes de Gmail (puntos y +etiqueta)', () => {
    expect(addParticipant(mk('ana.lopez@gmail.com'), during).ok).toBe(true);
    for (const v of ['analopez@gmail.com', 'Ana.Lopez+sorteo@Gmail.com', 'a.n.a.l.o.p.e.z+x+y@googlemail.com']) {
      const r = addParticipant(mk(v), during);
      expect(r.ok, v).toBe(false);
      if (!r.ok) expect(r.reason).toBe('duplicate');
    }
    expect(getParticipants()).toHaveLength(1);
  });

  it('no altera dominios que no son Gmail ni acepta un buzón vacío', () => {
    expect(normalizeEmail('a.na+x@ejemplo.mx')).toBe('a.na+x@ejemplo.mx');
    expect(addParticipant(mk('ana@ejemplo.mx'), during).ok).toBe(true);
    expect(addParticipant(mk('a.na@ejemplo.mx'), during).ok).toBe(true);
    const r = addParticipant(mk('+x@gmail.com'), during);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('email');
  });
});

describe('2. una inscripción sin confirmar no participa', () => {
  it('solo los confirmados entran al bombo', async () => {
    const [a, b] = enroll(2, false);
    expect(confirmParticipant(a.token, during)).toBe('ok');
    const r = await performDraw(confirmDeadline());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.draw.winnerId).toBe(a.id);
      expect(r.draw.poolIds).toEqual([a.id]);
      expect(r.draw.poolIds).not.toContain(b.id);
    }
  });

  it('sin ningún confirmado no hay sorteo', async () => {
    enroll(3, false);
    expect(await performDraw(confirmDeadline())).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('3. las inscripciones se cierran solas en la fecha y hora indicadas', () => {
  it('acepta justo antes del cierre y rechaza desde el cierre', () => {
    const e = end().getTime();
    expect(addParticipant(mk('a@ejemplo.mx'), new Date(e - 1)).ok).toBe(true);
    const late = addParticipant(mk('b@ejemplo.mx'), new Date(e));
    expect(late.ok).toBe(false);
    if (!late.ok) expect(late.reason).toBe('closed');
  });

  it('rechaza antes de la apertura', () => {
    const r = addParticipant(mk('a@ejemplo.mx'), new Date(start - 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('not_started');
  });

  it('un formulario abierto no puede inscribir pasada la hora (la comprobación está en el guardado)', () => {
    // el usuario abrió el formulario antes del cierre; envía tras el cierre
    const r = addParticipant(mk('tarde@ejemplo.mx'), new Date(end().getTime() + 5000));
    expect(r.ok).toBe(false);
    expect(getParticipants()).toHaveLength(0);
  });

  it('las fechas llevan zona horaria: el cierre es el mismo instante para todos', () => {
    expect(config.endDate).toMatch(/[+-]\d\d:\d\d$/);
    expect(new Date(config.endDate).toISOString()).toBe('2026-12-01T07:59:59.000Z');
  });

  it('el cierre manual adelanta el cierre y se puede reabrir antes del sorteo', () => {
    const t = new Date(start + 7200_000);
    expect(closeNow(t)).toBe(true);
    expect(addParticipant(mk('c@ejemplo.mx'), new Date(t.getTime() + 1)).ok).toBe(false);
    expect(reopen(t)).toBe(true);
    expect(addParticipant(mk('c@ejemplo.mx'), new Date(t.getTime() + 1)).ok).toBe(true);
  });
});

describe('margen de confirmación', () => {
  it('se puede confirmar durante el margen y no después', () => {
    const r = addParticipant(mk('ultimo@ejemplo.mx'), new Date(end().getTime() - 1));
    if (!r.ok) throw new Error('debería inscribirse');
    const inside = new Date(end().getTime() + 3600_000);
    const outside = new Date(confirmDeadline().getTime());
    expect(confirmParticipant(r.participant.token, outside)).toBe('expired');
    expect(confirmParticipant(r.participant.token, inside)).toBe('ok');
    expect(confirmParticipant(r.participant.token, inside)).toBe('already');
    expect(confirmParticipant('token-falso', inside)).toBe('invalid');
  });

  it('el sorteo no se habilita hasta que termina el margen', async () => {
    enroll(2);
    expect(drawEnabled(end())).toBe(false);
    expect(await performDraw(new Date(end().getTime() + 1000))).toEqual({ ok: false, reason: 'not_enabled' });
    expect(drawEnabled(confirmDeadline())).toBe(true);
  });
});

describe('4. el sorteo registra fecha, participantes y resultado; repetible para suplentes', () => {
  it('guarda todo, no repite ganadores y encadena las huellas', async () => {
    const people = enroll(3);
    const at = confirmDeadline();
    const r1 = await performDraw(at);
    const r2 = await performDraw(new Date(at.getTime() + 1000));
    const r3 = await performDraw(new Date(at.getTime() + 2000));
    expect(r1.ok && r2.ok && r3.ok).toBe(true);
    if (!(r1.ok && r2.ok && r3.ok)) return;

    expect(r1.draw.kind).toBe('ganador');
    expect(r2.draw.kind).toBe('suplente');
    expect(r1.draw.createdAt).toBe(at.toISOString());
    expect(r1.draw.poolSize).toBe(3);
    expect([...r1.draw.poolIds].sort()).toEqual(people.map((p) => p.id).sort());
    expect(r1.draw.poolHash).toHaveLength(64);
    expect(r2.draw.poolSize).toBe(2);
    expect(r2.draw.excludedIds).toEqual([r1.draw.winnerId]);
    expect(new Set([r1, r2, r3].map((r) => (r.ok ? r.draw.winnerId : ''))).size).toBe(3);
    expect(r2.draw.prevHash).toBe(r1.draw.hash);
    expect(await performDraw(new Date(at.getTime() + 3000))).toEqual({ ok: false, reason: 'empty' });
    expect(await verifyChain(getDraws())).toEqual({ ok: true });
  });

  it('detecta si se altera el registro (resultado o bombo)', async () => {
    enroll(3);
    const at = confirmDeadline();
    await performDraw(at);
    await performDraw(new Date(at.getTime() + 1000));

    const draws = getDraws();
    const tampered = structuredClone(draws);
    tampered[0].winnerId = 'OTRO';
    expect(await verifyChain(tampered)).toEqual({ ok: false, brokenAt: 1 });

    const tampered2 = structuredClone(draws);
    tampered2[1].poolIds = tampered2[1].poolIds.slice(1);
    expect((await verifyChain(tampered2)).ok).toBe(false);

    const cut = structuredClone(draws).slice(1);
    expect((await verifyChain(cut)).ok).toBe(false);
  });

  it('el sorteo es uniforme (sin sesgo apreciable)', async () => {
    const { randomIndex } = await import('../src/lib/draw');
    const n = 7;
    const counts = new Array(n).fill(0);
    const trials = 70000;
    for (let i = 0; i < trials; i++) counts[randomIndex(n)]++;
    for (const c of counts) expect(Math.abs(c - trials / n)).toBeLessThan((trials / n) * 0.05);
  });

  it('tras el primer sorteo la lista y los ajustes quedan congelados', async () => {
    const [p] = enroll(2);
    await performDraw(confirmDeadline());
    expect(removeParticipant(p.id)).toBe(false);
    expect(confirmManually(p.id)).toBe(false);
    expect(setDeadlineOverride(new Date())).toBe(false);
    expect(closeNow()).toBe(false);
    expect(reopen()).toBe(false);
    expect(getParticipants()).toHaveLength(2);
  });
});

describe('5. el permiso de comunicaciones se guarda por separado', () => {
  it('va en un registro aparte, con fecha y versión de las bases', () => {
    const a = addParticipant(mk('si@ejemplo.mx', { commsOptIn: true }), during);
    const b = addParticipant(mk('no@ejemplo.mx', { commsOptIn: false }), during);
    if (!a.ok || !b.ok) throw new Error('inscripción');
    expect(Object.keys(a.participant)).not.toContain('commsOptIn');
    expect(Object.keys(a.participant)).not.toContain('consentBases');

    const consents = getConsents();
    expect(consents).toHaveLength(2);
    const ca = consents.find((c) => c.participantId === a.participant.id)!;
    const cb = consents.find((c) => c.participantId === b.participant.id)!;
    expect(ca.comms.accepted).toBe(true);
    expect(cb.comms.accepted).toBe(false);
    expect(ca.bases.accepted && cb.bases.accepted).toBe(true);
    expect(ca.bases.version).toBe(config.basesVersion);
    expect(ca.bases.at).toBe(during.toISOString());
    expect(ca.comms.at).toBe(during.toISOString());
    expect(localStorage.getItem(KEYS.consents)).not.toBe(localStorage.getItem(KEYS.participants));
  });

  it('las bases son obligatorias; el permiso de comunicaciones no', () => {
    const r = addParticipant(mk('x@ejemplo.mx', { consentBases: false }), during);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('bases');
    expect(addParticipant(mk('y@ejemplo.mx', { commsOptIn: false }), during).ok).toBe(true);
  });
});

describe('validaciones, confirmación manual y CSV', () => {
  it('valida nombre, correo y teléfono', () => {
    const reason = (x: Parameters<typeof addParticipant>[0]) => {
      const r = addParticipant(x, during);
      return r.ok ? 'ok' : r.reason;
    };
    expect(reason(mk('malo'))).toBe('email');
    expect(reason(mk('a@b.mx', { nombre: ' ' }))).toBe('nombre');
    expect(reason(mk('a@b.mx', { telefono: '123' }))).toBe('telefono');
    expect(reason(mk('a@b.mx', { telefono: '664 123 4567' }))).toBe('ok');
  });

  it('la confirmación manual queda marcada y anotada en la actividad', () => {
    const [p] = enroll(1, false);
    expect(confirmManually(p.id, during)).toBe(true);
    const saved = getParticipants()[0];
    expect(saved.status).toBe('confirmado');
    expect(saved.confirmMethod).toBe('manual');
    expect(getAudit().some((a) => a.action === 'confirmación manual')).toBe(true);
  });

  it('los cambios de ajustes se anotan', () => {
    setDeadlineOverride(new Date('2027-01-01T00:00:00Z'), during);
    closeNow(during);
    const actions = getAudit().map((a) => a.action);
    expect(actions).toEqual(['cambio de fecha de cierre', 'cierre manual']);
  });

  it('el CSV neutraliza fórmulas y recoge los consentimientos', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1')).toBe(`"'+1"`);
    expect(csvCell('normal')).toBe('"normal"');
    const r = addParticipant(mk('csv@ejemplo.mx', { nombre: '=cmd', commsOptIn: true }), during);
    if (!r.ok) throw new Error('inscripción');
    const csv = participantsCsv(getParticipants(), getConsents());
    expect(csv).toContain(`"'=cmd"`);
    expect(csv.split('\n')[0]).toContain('acepta_comunicaciones');
    expect(csv).toContain(config.basesVersion);
  });
});

describe('zona horaria', () => {
  it('convierte entre hora de Tijuana e instante real (con cambio de horario)', () => {
    // 30-nov-2026 23:59 en Tijuana = UTC-8
    expect(fromZonedInput('2026-11-30T23:59').toISOString()).toBe('2026-12-01T07:59:00.000Z');
    // 20-oct-2026 12:00 en Tijuana = UTC-7 (horario de verano)
    expect(fromZonedInput('2026-10-20T12:00').toISOString()).toBe('2026-10-20T19:00:00.000Z');
    expect(toZonedInput(new Date('2026-12-01T07:59:00Z'))).toBe('2026-11-30T23:59');
    expect(toZonedInput(fromZonedInput('2026-11-01T01:30'))).toBeTypeOf('string');
  });
});
