import { config } from '../config';
import { deadline, confirmDeadline } from '../lib/state';
import { fmt } from '../lib/time';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-brand">{title}</h2>
      <div className="mt-2 space-y-3 text-ink-soft leading-relaxed">{children}</div>
    </section>
  );
}

export default function Bases() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-black">
        Bases del {config.title}
      </h1>
      <p className="mt-2 text-ink-soft">
        Organizado por {config.storeName}, {config.city}. Leídas y aceptadas
        antes de participar. Versión {config.basesVersion}.
      </p>
      {config.legalDraft && (
        <p
          role="note"
          className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200"
        >
          Texto provisional: pendiente de las bases definitivas del cliente y de
          revisión legal antes de publicar el concurso.
        </p>
      )}

      <Section title="1. Organizador">
        <p>
          El concurso {config.title} es organizado por {config.storeName},
          con domicilio y atención en {config.city}. Para cualquier consulta
          sobre el concurso, escríbenos a {config.contactEmail}.
        </p>
      </Section>

      <Section title="2. Participación">
        <p>
          La participación es <strong className="text-ink">gratuita</strong> y{' '}
          <strong className="text-ink">no requiere compra ni pago alguno</strong>,
          ni seguir cuentas en redes sociales. Puede participar cualquier
          persona mayor de 18 años residente en México, una sola vez por
          correo electrónico.
        </p>
        <p>
          Cada dirección de correo electrónico cuenta como una única
          participación, aunque se escriba con mayúsculas o minúsculas, con o
          sin espacios. Las inscripciones duplicadas se detectan y descartan
          automáticamente.
        </p>
      </Section>

      <Section title="3. Fechas">
        <ul className="list-disc pl-6 space-y-1">
          <li>Apertura de inscripciones: {fmt(new Date(config.startDate))}.</li>
          <li>Cierre de inscripciones: {fmt(deadline())}. Las inscripciones se cierran automáticamente en esa fecha y hora; lo que llegue después no participa.</li>
          <li>Confirmación del correo: hasta el {fmt(confirmDeadline())}. Pasado ese plazo, las inscripciones sin confirmar no entran al sorteo.</li>
          <li>Sorteo: {fmt(new Date(config.drawDate))}.</li>
        </ul>
        <p>
          Todas las fechas y horas se indican en hora de {config.city.split(',')[0]}{' '}
          ({config.timeZone}), sin importar desde dónde se participe.
        </p>
      </Section>

      <Section title="4. Cómo participar">
        <ul className="list-disc pl-6 space-y-1">
          <li>Llenar el formulario de la página con nombre y correo electrónico (el teléfono es opcional).</li>
          <li>Aceptar estas bases y el aviso de privacidad, marcando la casilla correspondiente. Sin esa aceptación la inscripción no es válida.</li>
          <li>Confirmar la inscripción mediante el enlace que se envía al correo registrado. <strong className="text-ink">Solo las inscripciones confirmadas participan en el sorteo.</strong></li>
        </ul>
      </Section>

      <Section title="5. Premio">
        <p>
          Se entrega <strong className="text-ink">{config.prize}</strong>. El
          premio es personal e intransferible, no puede canjearse por efectivo
          y se entrega en {config.city}.
        </p>
      </Section>

      <Section title="6. Elección del ganador">
        <p>
          El ganador se elige <strong className="text-ink">al azar</strong> entre
          todas las inscripciones confirmadas recibidas antes del cierre. La
          selección se realiza con un generador de números aleatorios
          criptográfico y queda registrada con fecha, lista de participantes
          del bombo, resultado y una huella (SHA-256) que encadena cada
          selección con la anterior, de forma que cualquier alteración
          posterior del registro pueda detectarse. La huella final se publica
          junto con el resultado.
        </p>
        <p>
          Si el ganador no responde dentro de{' '}
          <strong className="text-ink">3 días naturales</strong> tras el aviso,
          se selecciona a un suplente con el mismo procedimiento, dejando
          también registro de cada selección.
        </p>
      </Section>

      <Section title="7. Publicación y entrega">
        <p>
          El resultado se anuncia en esta misma página y se notifica al
          ganador al correo con el que participó. La entrega del premio se
          coordina directamente con la tienda.
        </p>
      </Section>

      <Section title="8. Aviso de privacidad">
        <p>
          <strong className="text-ink">Responsable:</strong> {config.storeName},{' '}
          {config.city}. Contacto: {config.contactEmail}.
        </p>
        <p>
          <strong className="text-ink">Datos que se recaban:</strong> nombre,
          correo electrónico y, si lo das, teléfono. También se guardan la
          fecha de tu inscripción, la de tu confirmación y la versión de estas
          bases que aceptaste.
        </p>
        <p>
          <strong className="text-ink">Finalidades necesarias:</strong> gestionar
          el concurso y el sorteo, identificar participantes, evitar
          duplicados, contactar al ganador y poder demostrar el resultado. La
          aceptación de estas bases y de este aviso es obligatoria para
          participar.
        </p>
        <p>
          <strong className="text-ink">Finalidad opcional:</strong> enviarte
          noticias y promociones de la tienda. Es{' '}
          <strong className="text-ink">voluntaria, se pide por separado y no
          afecta a tu participación</strong>: puedes participar sin darla. Si
          la das, puedes retirarla cuando quieras escribiendo a{' '}
          {config.contactEmail}.
        </p>
        <p>
          <strong className="text-ink">Tus derechos:</strong> puedes ejercer
          tus derechos de acceso, rectificación, cancelación y oposición (ARCO)
          escribiendo a {config.contactEmail}. No transferimos tus datos a
          terceros salvo obligación legal.
        </p>
      </Section>

      <Section title="9. Aceptación">
        <p>
          La participación en el concurso implica la aceptación plena de estas
          bases. Cualquier situación no prevista se resolverá de forma
          transparente por el organizador, sin que ello reduzca los derechos
          que por ley corresponden a los participantes.
        </p>
      </Section>

      <div className="mt-10 text-center">
        <a
          href="#/inscribir"
          className="inline-block rounded-xl bg-brand px-8 py-4 font-bold text-night hover:brightness-110 transition"
        >
          Acepto las bases y quiero participar
        </a>
      </div>
    </article>
  );
}
