import { describe, it, expect } from 'vitest';
import { confirmationEmail, winnerEmail } from '../src/lib/emails';
import { config } from '../src/config';

describe('plantillas de correo', () => {
  it('la confirmación lleva el nombre, el enlace y el plazo', () => {
    const link = 'https://ejemplo.mx/#/confirmar?t=ABC123';
    const m = confirmationEmail({ nombre: 'Ana López' }, link, new Date('2026-12-01T23:59:59-08:00'));
    expect(m.subject).toContain(config.title);
    expect(m.body).toContain('Ana López');
    expect(m.body).toContain(link);
    expect(m.body).toMatch(/2026/);
    expect(m.body).toContain(config.contactEmail);
  });

  it('el aviso distingue ganador y suplente y menciona el premio solo al ganador', () => {
    const d = new Date('2026-12-02T17:00:00-08:00');
    const g = winnerEmail({ nombre: 'Luis' }, 'ganador', d);
    const s = winnerEmail({ nombre: 'Luis' }, 'suplente', d);
    expect(g.subject).toContain('Ganaste');
    expect(g.body).toContain(config.prizeHeadline);
    expect(s.subject).toContain('suplente');
    expect(s.body).toContain('suplente');
    expect(g.subject).not.toBe(s.subject);
  });
});
