import { config } from '../config';
import { isOpen, isStarted, deadline, confirmDeadline } from '../lib/state';
import { useNow } from '../lib/useNow';
import { fmt } from '../lib/time';

const steps = [
  {
    n: '1',
    t: 'Llena el formulario',
    d: 'Tu nombre, correo y, si quieres, tu teléfono. Menos de un minuto.',
  },
  {
    n: '2',
    t: 'Confirma tu correo',
    d: 'Te enviamos un enlace de confirmación. Solo participan quienes confirman.',
  },
  {
    n: '3',
    t: 'Listo, ya participas',
    d: 'El día del sorteo elegimos al ganador al azar entre las participaciones confirmadas.',
  },
];

const trust = [
  {
    t: 'Sin compra necesaria',
    d: 'Participar es gratis y no depende de seguir redes ni comprar nada.',
  },
  {
    t: 'Una participación por correo',
    d: 'Cada correo cuenta una sola vez, aunque se escriba con mayúsculas o espacios.',
  },
  {
    t: 'Sorteo demostrable',
    d: 'La selección del ganador se hace al azar y queda registrada con fecha, lista de participantes y una huella que permite comprobar que no se alteró.',
  },
  {
    t: 'Tus datos, tu decisión',
    d: 'Aceptar las bases es obligatorio para participar; recibir noticias de la tienda es opcional y por separado.',
  },
];

export default function Landing() {
  // El reloj refresca la insignia y los botones al llegar la hora de apertura o cierre.
  const now = useNow();
  const open = isOpen(now);
  const badge = open
    ? `Inscripciones abiertas · cierran el ${fmt(deadline())}`
    : isStarted(now)
      ? 'Inscripciones cerradas'
      : `Abren el ${fmt(new Date(config.startDate))}`;

  return (
    <div>
      {/* Portada */}
      <section className="relative overflow-hidden">
        <img
          src={config.heroImage}
          alt=""
          width={1920}
          height={1024}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night/40 via-night/70 to-night" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28 text-center">
          <p className="inline-block rounded-full border border-brand/40 bg-brand/10 px-4 py-1 text-sm text-brand">
            {badge}
          </p>
          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight leading-tight">
            {config.title}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-ink-soft max-w-2xl mx-auto">
            Gana <strong className="text-ink">{config.prize}</strong>. Participa
            gratis desde {config.city}: sin compra, sin vueltas, y con un
            ganador que nadie pueda discutir.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {open ? (
              <a
                href="#/inscribir"
                className="rounded-xl bg-brand px-8 py-4 text-lg font-bold text-night shadow-lg shadow-brand/20 hover:brightness-110 transition"
              >
                Participar gratis
              </a>
            ) : (
              <span className="rounded-xl bg-white/10 px-8 py-4 text-lg font-bold text-ink-soft">
                {isStarted(now) ? 'Inscripciones cerradas' : 'Próximamente'}
              </span>
            )}
            <a
              href="#/bases"
              className="rounded-xl border border-white/20 px-8 py-4 font-semibold hover:bg-white/5 transition"
            >
              Ver bases legales
            </a>
          </div>
        </div>
      </section>

      {/* Cómo participar */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center">
          Cómo participar
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="rounded-2xl bg-night-soft border border-white/10 p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-night font-black text-lg">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
              <p className="mt-2 text-ink-soft">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Fechas */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="rounded-2xl border border-brand/30 bg-brand/5 p-8 grid gap-6 sm:grid-cols-3 text-center">
          <div>
            <p className="text-sm text-ink-soft">Apertura</p>
            <p className="mt-1 font-bold">{fmt(new Date(config.startDate))}</p>
          </div>
          <div>
            <p className="text-sm text-ink-soft">Cierre de inscripciones</p>
            <p className="mt-1 font-bold">{fmt(deadline())}</p>
          </div>
          <div>
            <p className="text-sm text-ink-soft">Sorteo</p>
            <p className="mt-1 font-bold">{fmt(new Date(config.drawDate))}</p>
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-ink-soft">
          Todas las horas son de {config.city.split(',')[0]} (zona {config.timeZone}). Puedes
          confirmar tu correo hasta el {fmt(confirmDeadline())}.
        </p>
      </section>

      {/* Juego limpio */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center">
          Juego limpio, de principio a fin
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {trust.map((t) => (
            <div
              key={t.t}
              className="rounded-2xl bg-night-soft border border-white/10 p-6"
            >
              <h3 className="font-bold text-brand">{t.t}</h3>
              <p className="mt-2 text-ink-soft">{t.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          {open && (
            <a
              href="#/inscribir"
              className="inline-block rounded-xl bg-brand px-10 py-4 text-lg font-bold text-night hover:brightness-110 transition"
            >
              Quiero participar
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
