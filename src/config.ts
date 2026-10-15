// ============================================================
// CONFIGURACIÓN DEL CONCURSO
// Todo lo marcado con "PROVISIONAL" son valores de ejemplo que
// hay que sustituir con los materiales reales del cliente
// (nombre de la tienda, premio, fechas, contacto).
// ============================================================

export const config = {
  // PROVISIONAL: nombre real de la tienda
  storeName: 'Tu Tienda de Instrumentos',
  city: 'Tijuana, B.C.',
  title: 'Gran Concurso de Instrumentos',

  // PROVISIONAL: premio real y su descripción
  prize: 'Una guitarra eléctrica con amplificador y cable (valor aproximado: $8,000 MXN)',

  // Zona horaria oficial del concurso. TODAS las fechas se interpretan y se
  // muestran en esta zona, sin importar desde dónde entre cada visitante.
  timeZone: 'America/Tijuana',

  // Fechas (PROVISIONALES). Llevan el desfase horario explícito:
  // Tijuana es UTC-7 hasta el 1-nov-2026 y UTC-8 después.
  startDate: '2026-10-15T00:00:00-07:00',
  // El cierre automático de inscripciones usa esta fecha y hora.
  endDate: '2026-11-30T23:59:59-08:00',
  // Fecha del sorteo (PROVISIONAL): se anuncia en la landing y en las bases.
  drawDate: '2026-12-02T17:00:00-08:00',

  // Horas tras el cierre en las que todavía se puede confirmar el correo.
  // El sorteo solo se habilita cuando termina este margen.
  confirmGraceHours: 24,

  // Versión de las bases que acepta cada participante (queda guardada con
  // su consentimiento). Cámbiala cada vez que cambie el texto legal.
  basesVersion: '2026-10-borrador-1',

  // Mientras sea true, la página de bases muestra un aviso de texto
  // provisional pendiente de revisión legal. Ponlo en false al publicar.
  legalDraft: true,

  // Código de acceso al panel de administración.
  // PROVISIONAL: cámbialo antes de publicar (o define VITE_ADMIN_CODE).
  // OJO: al ser una web sin servidor, este código viaja dentro del JavaScript
  // y NO es seguridad real. Con backend se sustituye por autenticación.
  adminCode: (import.meta.env.VITE_ADMIN_CODE as string | undefined) ?? 'tijuana2026',

  // PROVISIONAL: correo de contacto real de la tienda
  contactEmail: 'concurso@tutiendadeinstrumentos.mx',

  heroImage: './hero.jpg',
};
