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

  // Fechas de inscripción (PROVISIONALES). Formato ISO local.
  startDate: '2026-10-15T00:00:00',
  // El cierre automático de inscripciones usa esta fecha y hora.
  endDate: '2026-11-30T23:59:59',
  // Fecha del sorteo (PROVISIONAL): se anuncia en la landing y en las bases.
  drawDate: '2026-12-02T17:00:00',

  // Código de acceso al panel de administración.
  // PROVISIONAL: cámbialo antes de publicar.
  adminCode: 'tijuana2026',

  // PROVISIONAL: correo de contacto real de la tienda
  contactEmail: 'concurso@tutiendadeinstrumentos.mx',

  heroImage: './hero.jpg',
};
