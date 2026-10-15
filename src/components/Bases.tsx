import { config } from '../config';
import { deadline } from '../lib/state';

function fmt(d: Date) {
  return d.toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
}

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
        antes de participar.
      </p>

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
          <li>Sorteo: {fmt(new Date(config.drawDate))}.</li>
        </ul>
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
          selección se realiza con un procedimiento aleatorio y queda
          registrada con fecha, lista de participantes del bombo y resultado,
          de forma que el proceso pueda verificarse.
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

      <Section title="8. Protección de datos">
        <p>
          Los datos se usan únicamente para gestionar el concurso y el sorteo:
          identificar participantes, evitar duplicados, contactar al ganador y
          poder demostrar el resultado. Por un lado, la aceptación de estas
          bases y del aviso de privacidad es obligatoria para participar. Por
          otro, el permiso para recibir noticias y promociones de la tienda es{' '}
          <strong className="text-ink">voluntario y se recoge por separado</strong>:
          no participar en el sorteo está condicionado a dar ese permiso, y
          puedes pedir en cualquier momento dejar de recibir comunicaciones
          escribiendo a {config.contactEmail}.
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
