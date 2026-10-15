export type ParticipantStatus = 'pendiente' | 'confirmado';

export interface Participant {
  id: string;
  nombre: string;
  email: string;
  /** Correo normalizado (sin espacios y en minúsculas) para detectar duplicados */
  emailKey: string;
  telefono: string;
  /** Consentimiento de bases y aviso de privacidad (obligatorio) */
  consentBases: boolean;
  /** Permiso de comunicaciones comerciales, se guarda SEPARADO del consentimiento de bases */
  commsOptIn: boolean;
  createdAt: string;
  confirmedAt: string | null;
  status: ParticipantStatus;
  /** Token de confirmación por correo */
  token: string;
}

export interface Draw {
  id: string;
  createdAt: string;
  kind: 'ganador' | 'suplente';
  winnerId: string;
  winnerNombre: string;
  winnerEmail: string;
  /** Tamaño del bombo (participantes con opción de ganar en ese sorteo) */
  poolSize: number;
  /** Ids de todas las participaciones que estaban en el bombo */
  poolIds: string[];
  /** Participantes ya premiados que quedaron fuera de este bombo */
  excludedIds: string[];
}

export interface Settings {
  /** Fecha de cierre alternativa fijada desde el panel (ISO). Vacío = usar config.ts */
  deadlineOverride?: string;
  /** Cierre manual de inscripciones desde el panel */
  closedOverride?: boolean;
}
