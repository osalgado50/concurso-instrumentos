import type { Participant, Consent, Draw, AuditEntry } from '../types';

/**
 * Celda CSV segura: escapa comillas y neutraliza las fórmulas (= + - @) que
 * Excel o Sheets ejecutarían al abrir un nombre malicioso.
 */
export function csvCell(v: unknown): string {
  let t = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
  return `"${t.replace(/"/g, '""')}"`;
}

const line = (cells: unknown[]) => cells.map(csvCell).join(',');

export function participantsCsv(list: Participant[], consents: Consent[]): string {
  const headers = [
    'id',
    'nombre',
    'correo',
    'telefono',
    'estado',
    'metodo_confirmacion',
    'inscrito',
    'confirmado',
    'acepta_bases',
    'version_bases',
    'fecha_aceptacion_bases',
    'acepta_comunicaciones',
    'fecha_decision_comunicaciones',
  ];
  const rows = list.map((p) => {
    const c = consents.find((x) => x.participantId === p.id);
    return line([
      p.id,
      p.nombre,
      p.email,
      p.telefono,
      p.status,
      p.confirmMethod ?? '',
      p.createdAt,
      p.confirmedAt ?? '',
      c?.bases.accepted ? 'si' : 'no',
      c?.bases.version ?? '',
      c?.bases.at ?? '',
      c?.comms.accepted ? 'si' : 'no',
      c?.comms.at ?? '',
    ]);
  });
  return [headers.join(','), ...rows].join('\n');
}

export function drawCsv(draws: Draw[]): string {
  const headers = [
    'orden',
    'fecha',
    'tipo',
    'ganador',
    'correo_ganador',
    'tamanio_bombo',
    'huella_bombo',
    'participantes_bombo',
    'excluidos',
    'algoritmo',
    'huella_anterior',
    'huella',
  ];
  const rows = draws.map((d) =>
    line([
      d.order,
      d.createdAt,
      d.kind,
      d.winnerNombre,
      d.winnerEmail,
      d.poolSize,
      d.poolHash,
      d.poolIds.join(' '),
      d.excludedIds.join(' '),
      d.algorithm,
      d.prevHash,
      d.hash,
    ]),
  );
  return [headers.join(','), ...rows].join('\n');
}

export function auditCsv(entries: AuditEntry[]): string {
  const rows = entries.map((e) => line([e.at, e.action, e.detail]));
  return [['fecha', 'accion', 'detalle'].join(','), ...rows].join('\n');
}
