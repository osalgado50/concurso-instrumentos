import { describe, it, expect } from 'vitest';
import { addParticipant, sanitizePhone, isValidPhone } from '../src/lib/store';

const during = new Date('2026-11-01T12:00:00-07:00');
const base = {
  nombre: 'Ana López',
  email: 'ana@ejemplo.mx',
  consentBases: true,
  commsOptIn: false,
};

describe('teléfono: solo números y símbolos de marcación', () => {
  it('al escribir o pegar se quitan las letras y símbolos no permitidos', () => {
    expect(sanitizePhone('664abc123')).toBe('664123');
    expect(sanitizePhone('+52 (664) 123-4567')).toBe('+52 (664) 123-4567');
    expect(sanitizePhone('ext. #12*')).toBe('#12*');
    expect(sanitizePhone('tel: 6641234567 ñ')).toBe('6641234567 ');
    expect(sanitizePhone('<script>1</script>')).toBe('1');
  });

  it('pegar un texto con letras delante conserva el "+" y todos los dígitos', () => {
    expect(sanitizePhone('Tel +52 (664) 123-4567 ext#9')).toBe('+52 (664) 123-4567 #9');
    expect(sanitizePhone('abc')).toBe('');
    expect(sanitizePhone('1'.repeat(40)).length).toBe(25);
  });

  it('el "+" solo se conserva al principio', () => {
    expect(sanitizePhone('52+664')).toBe('52664');
    expect(sanitizePhone('+52+664')).toBe('+52664');
  });

  it('valida longitud en dígitos y rechaza letras', () => {
    expect(isValidPhone('+52 (664) 123-4567')).toBe(true);
    expect(isValidPhone('6641234567')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('664123456a')).toBe(false);
    expect(isValidPhone('1234567890123456')).toBe(false);
  });

  it('el guardado rechaza teléfonos con letras aunque se salten el formulario', () => {
    const r = addParticipant({ ...base, telefono: '664 123 45ab' }, during);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('telefono');
  });

  it('acepta un teléfono vacío (es opcional) y uno con prefijo y paréntesis', () => {
    expect(addParticipant({ ...base, telefono: '' }, during).ok).toBe(true);
    expect(
      addParticipant({ ...base, email: 'b@ejemplo.mx', telefono: '+52 (664) 123 4567' }, during).ok,
    ).toBe(true);
  });
});
