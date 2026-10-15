import { config } from '../config';
import {
  KEYS,
  getParticipants,
  saveParticipants,
  saveConsents,
  saveDraws,
  saveSettingsRaw,
  token,
  logAudit,
} from './storage';
import { normalizeEmail } from './store';
import type { Participant, Consent } from '../types';

/**
 * Herramientas de demostración (se desactivan con `demoTools: false` en config.ts).
 * Cargan inscripciones FICTICIAS para poder probar el panel, el sorteo y las
 * exportaciones, y permiten borrar todo para empezar de cero.
 */

const DEMO_KEY = 'concurso.demo.v1';

export type DemoState = 'seeded' | 'cleared' | null;

export function getDemoState(): DemoState {
  try {
    const v = localStorage.getItem(DEMO_KEY);
    return v === 'seeded' || v === 'cleared' ? v : null;
  } catch {
    return null;
  }
}

function setDemoState(v: DemoState) {
  try {
    if (v) localStorage.setItem(DEMO_KEY, v);
    else localStorage.removeItem(DEMO_KEY);
  } catch {
    /* sin almacenamiento: se ignora */
  }
}

// Personas ficticias (no existen). Los correos usan el dominio reservado .mx de ejemplo.
const PEOPLE: { nombre: string; correo: string; tel: string; confirmada: boolean; comms: boolean }[] = [
  { nombre: 'Ana López Ramírez', correo: 'ana.lopez@ejemplo.mx', tel: '+52 664 123 4501', confirmada: true, comms: true },
  { nombre: 'Carlos Hernández Soto', correo: 'carlos.hernandez@ejemplo.mx', tel: '664 123 4502', confirmada: true, comms: false },
  { nombre: 'María Fernanda Ortiz', correo: 'mafer.ortiz@ejemplo.mx', tel: '', confirmada: true, comms: true },
  { nombre: 'Luis Ángel Torres', correo: 'luis.torres@ejemplo.mx', tel: '+52 (664) 123-4504', confirmada: true, comms: false },
  { nombre: 'Sofía Martínez Cruz', correo: 'sofia.martinez@ejemplo.mx', tel: '664 123 4505', confirmada: true, comms: true },
  { nombre: 'Diego Ramírez Peña', correo: 'diego.ramirez@ejemplo.mx', tel: '', confirmada: false, comms: false },
  { nombre: 'Valeria Gómez Luna', correo: 'valeria.gomez@ejemplo.mx', tel: '664 123 4507', confirmada: true, comms: true },
  { nombre: 'Jorge Castillo Vera', correo: 'jorge.castillo@ejemplo.mx', tel: '+52 664 123 4508', confirmada: true, comms: false },
  { nombre: 'Camila Reyes Navarro', correo: 'camila.reyes@ejemplo.mx', tel: '', confirmada: true, comms: true },
  { nombre: 'Andrés Morales Ibarra', correo: 'andres.morales@ejemplo.mx', tel: '664 123 4510', confirmada: false, comms: true },
  { nombre: 'Daniela Flores Rojas', correo: 'daniela.flores@ejemplo.mx', tel: '664 123 4511', confirmada: true, comms: false },
  { nombre: 'Miguel Ángel Vargas', correo: 'miguel.vargas@ejemplo.mx', tel: '', confirmada: true, comms: true },
  { nombre: 'Paola Mendoza Díaz', correo: 'paola.mendoza@ejemplo.mx', tel: '+52 664 123 4513', confirmada: true, comms: true },
  { nombre: 'Ricardo Salazar León', correo: 'ricardo.salazar@ejemplo.mx', tel: '664 123 4514', confirmada: false, comms: false },
  { nombre: 'Fernanda Aguilar Paz', correo: 'fernanda.aguilar@ejemplo.mx', tel: '', confirmada: true, comms: false },
  { nombre: 'Emilio Cortés Bravo', correo: 'emilio.cortes@ejemplo.mx', tel: '664 123 4516', confirmada: true, comms: true },
  { nombre: 'Regina Domínguez Silva', correo: 'regina.dominguez@ejemplo.mx', tel: '664 123 4517', confirmada: false, comms: true },
  { nombre: 'Héctor Guzmán Ponce', correo: 'hector.guzman@ejemplo.mx', tel: '', confirmada: true, comms: false },
  { nombre: 'Isabella Campos Rubio', correo: 'isabella.campos@ejemplo.mx', tel: '+52 664 123 4519', confirmada: true, comms: true },
  { nombre: 'Sebastián Núñez Roca', correo: 'sebastian.nunez@ejemplo.mx', tel: '664 123 4520', confirmada: true, comms: false },
];

/** Sustituye los datos actuales por inscripciones de ejemplo. Devuelve cuántas cargó. */
export function seedDemo(now: Date = new Date()): number {
  const start = new Date(config.startDate).getTime();
  const n = PEOPLE.length;
  const participants: Participant[] = [];
  const consents: Consent[] = [];

  PEOPLE.forEach((p, i) => {
    const created = new Date(Math.min(now.getTime(), Math.max(start, now.getTime() - (n - i) * 10 * 60000)));
    const confirmedAt = new Date(Math.min(now.getTime(), created.getTime() + 3 * 60000));
    const id = `DEMO${String(i + 1).padStart(3, '0')}`;
    participants.push({
      id,
      nombre: p.nombre,
      email: p.correo,
      emailKey: normalizeEmail(p.correo),
      telefono: p.tel,
      createdAt: created.toISOString(),
      confirmedAt: p.confirmada ? confirmedAt.toISOString() : null,
      confirmMethod: p.confirmada ? 'enlace' : null,
      status: p.confirmada ? 'confirmado' : 'pendiente',
      token: token(),
    });
    consents.push({
      participantId: id,
      bases: { accepted: true, at: created.toISOString(), version: config.basesVersion },
      comms: { accepted: p.comms, at: created.toISOString() },
    });
  });

  saveParticipants(participants);
  saveConsents(consents);
  saveDraws([]);
  saveSettingsRaw({});
  localStorage.removeItem(KEYS.audit);
  setDemoState('seeded');
  logAudit('demo', `Datos de ejemplo cargados: ${n} inscripciones ficticias`, now);
  return n;
}

/** Borra TODOS los datos del concurso en este navegador y deja el panel vacío. */
export function clearAll() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  setDemoState('cleared');
}

/**
 * Primera vez que se abre el panel en este navegador y no hay nada guardado:
 * carga los datos de ejemplo. Después de "Borrar todo" ya no se vuelve a cargar solo.
 */
export function autoSeedIfEmpty(now: Date = new Date()): boolean {
  if (!config.demoTools) return false;
  if (getDemoState() !== null) return false;
  if (getParticipants().length > 0) return false;
  seedDemo(now);
  return true;
}
