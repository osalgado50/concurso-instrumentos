import { config } from '../config';
import { fmt } from './time';

/**
 * Plantillas de correo del concurso. En esta versión NO se envían: se muestran
 * en pantalla (al inscribirse y en la pestaña "Correos" del panel). Cuando se
 * conecte el servicio real de envío, estas funciones devuelven el asunto y el
 * cuerpo listos para mandar tal cual.
 */

export type EmailTemplate = { subject: string; body: string };

/** Correo de confirmación (doble validación): lleva el enlace de un solo uso. */
export function confirmationEmail(
  p: { nombre: string },
  link: string,
  confirmUntil: Date,
): EmailTemplate {
  return {
    subject: `Confirma tu participación en ${config.title}`,
    body: [
      `Hola, ${p.nombre}:`,
      '',
      `Recibimos tu inscripción en ${config.title} de ${config.storeName}.`,
      'Para participar tienes que confirmar tu correo con este enlace:',
      '',
      link,
      '',
      `Puedes confirmarlo hasta el ${fmt(confirmUntil)} (hora de ${config.city.split(',')[0]}). Si no confirmas, tu inscripción no entra al sorteo.`,
      '',
      'Si no fuiste tú, ignora este mensaje: no se activará ninguna participación.',
      '',
      `${config.storeName}`,
      config.contactEmail,
    ].join('\n'),
  };
}

/** Correo para la persona ganadora (o suplente). */
export function winnerEmail(
  w: { nombre: string },
  kind: 'ganador' | 'suplente',
  drawDate: Date,
): EmailTemplate {
  const esSuplente = kind === 'suplente';
  return {
    subject: esSuplente
      ? `Eres suplente ganador/a de ${config.title}`
      : `¡Ganaste ${config.title}!`,
    body: [
      `Hola, ${w.nombre}:`,
      '',
      esSuplente
        ? `Te escribimos de ${config.storeName}. Tras el sorteo del ${fmt(drawDate)}, la persona seleccionada antes no pudo recibir el premio y tú quedaste como suplente.`
        : `¡Felicidades! En el sorteo del ${fmt(drawDate)} de ${config.storeName} resultaste ganador/a de: ${config.prizeHeadline}.`,
      '',
      `Para entregarte el premio, responde a este correo o escríbenos a ${config.contactEmail} en un máximo de 5 días naturales, con una identificación oficial para verificar que eres la persona inscrita.`,
      '',
      'Si no respondemos de ti en ese plazo, el premio pasará a la siguiente persona suplente, como indican las bases.',
      '',
      `${config.storeName}`,
      config.contactEmail,
    ].join('\n'),
  };
}
