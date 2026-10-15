export type ParticipantStatus = 'pendiente' | 'confirmado';

export interface Participant {
  id: string;
  nombre: string;
  email: string;
  /** Correo normalizado (sin espacios, minúsculas, Unicode NFKC) para detectar duplicados */
  emailKey: string;
  telefono: string;
  createdAt: string;
  confirmedAt: string | null;
  /** 'enlace' = el participante confirmó su correo; 'manual' = lo confirmó el administrador */
  confirmMethod: 'enlace' | 'manual' | null;
  status: ParticipantStatus;
  /** Token de confirmación por correo */
  token: string;
}

/**
 * Consentimientos: viven en su PROPIO registro, separados del participante,
 * y cada uno guarda cuándo se dio (y, en el de bases, qué versión del texto).
 */
export interface Consent {
  participantId: string;
  /** Aceptación de bases y aviso de privacidad (obligatoria) */
  bases: { accepted: boolean; at: string; version: string };
  /** Permiso de comunicaciones comerciales (opcional e independiente) */
  comms: { accepted: boolean; at: string };
}

export interface Draw {
  id: string;
  /** Nº de selección: 1 = ganador, 2 en adelante = suplentes */
  order: number;
  createdAt: string;
  kind: 'ganador' | 'suplente';
  winnerId: string;
  winnerNombre: string;
  winnerEmail: string;
  /** Tamaño del bombo (participantes con opción de ganar en ese sorteo) */
  poolSize: number;
  /** Ids de todas las participaciones que estaban en el bombo, ordenados */
  poolIds: string[];
  /** Huella SHA-256 de la lista ordenada de ids del bombo */
  poolHash: string;
  /** Participantes ya premiados que quedaron fuera de este bombo */
  excludedIds: string[];
  algorithm: string;
  /** Huella de la selección anterior ('' en la primera): encadena el registro */
  prevHash: string;
  /** Huella SHA-256 de esta selección (incluye prevHash) */
  hash: string;
}

export interface Settings {
  /** Fecha de cierre alternativa fijada desde el panel (ISO con zona). Vacío = usar config.ts */
  deadlineOverride?: string;
  /** Instante en que se cerraron manualmente las inscripciones desde el panel */
  closedAt?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  action: string;
  detail: string;
}
