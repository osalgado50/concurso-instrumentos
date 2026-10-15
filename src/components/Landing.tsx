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
    d: 'Cada correo cuenta una sola vez, aunque se escriba con mayúsculas, espacios o, en Gmail, con puntos o «+».',
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

/** Cuenta atrás hasta el cierre: da sentido de urgencia real y se actualiza cada segundo. */
function Countdown({ to, now }: { to: Date; now: Date }) {
  const ms = Math.max(0, to.getTime() - now.getTime());
  const s = Math.floor(ms / 1000);
  const parts = [
    { v: Math.floor(s / 86400), l: 'días' },
    { v: Math.floor((s % 86400) / 3600), l: 'horas' },
    { v: Math.floor((s % 3600) / 60), l: 'min' },
    { v: s % 60, l: 'seg' },
  ];
  return (
    <div className="mt-10">
      <p className="text-sm text-ink-soft">Las inscripciones cierran en</p>
      <div
        role="timer"
        aria-label={`${parts[0].v} días, ${parts[1].v} horas y ${parts[2].v} minutos para el cierre`}
        className="mt-3 inline-flex divide-x divide-white/15 rounded-2xl border border-white/15 bg-night/60 backdrop-blur"
      >
        {parts.map((p) => (
          <div key={p.l} className="w-16 sm:w-24 py-3 text-center">
            <div className="text-3xl sm:text-5xl font-black tabular-nums leading-none">
              {String(p.v).padStart(2, '0')}
            </div>
            <div className="mt-1 text-xs sm:text-sm text-ink-soft">{p.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
        <div className="hero-lights" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-28 text-center">
          <p className="inline-block rounded-full border border-brand/40 bg-brand/10 px-4 py-1 text-sm text-brand">
            {badge}
          </p>
          <div className="title-glow mt-6">
            <h1 className="title-sweep text-[clamp(2.9rem,11vw,6.75rem)] font-black tracking-tighter leading-[0.92] text-ink">
              {config.title}
            </h1>
          </div>
          <p className="mt-6 text-xl md:text-2xl text-ink-soft max-w-2xl mx-auto leading-snug">
            Gana <strong className="text-ink">{config.prize}</strong>. Participa
            gratis desde {config.city}: sin compra, sin vueltas, y con un
            ganador que nadie pueda discutir.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            {open ? (
              <a
                href="#/inscribir"
                className="cta-live rounded-xl bg-brand px-10 py-5 text-xl font-extrabold text-night"
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
          {open && <Countdown to={deadline()} now={now} />}
        </div>
      </section>

      {/* El premio */}
      <section
        aria-labelledby="premio"
        className="mx-auto max-w-6xl px-4 pt-4 pb-16 md:pb-24"
      >
        <div className="prize-card relative isolate overflow-hidden rounded-3xl border border-brand/30 shadow-2xl shadow-brand/10 aspect-[4/5] sm:aspect-[16/10] lg:aspect-[21/9]">
          {/* Tres capas para que no se pisen los movimientos: deriva lenta, zoom al pasar el cursor y vaivén. */}
          <div className="prize-drift absolute inset-0 -z-10">
            <div className="prize-zoom h-full w-full">
              <img
                src={config.prizeImage}
                alt="Guitarras eléctricas y amplificador sobre un escenario iluminado"
                width={1920}
                height={1024}
                loading="lazy"
                decoding="async"
                className="prize-want h-full w-full object-cover object-[78%_55%]"
              />
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/45 to-transparent" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night/80 via-night/20 to-transparent" />

          <p className="prize-float absolute right-4 top-4 md:right-8 md:top-8 -rotate-[4deg] rounded-2xl bg-brand px-4 py-2 text-sm md:text-base font-extrabold text-night shadow-xl shadow-black/40">
            {config.prizeValue}
          </p>

          <div className="absolute inset-x-0 bottom-0 p-6 md:p-12 max-w-3xl">
            <h2
              id="premio"
              className="text-[clamp(2.2rem,7vw,4.75rem)] font-black tracking-tighter leading-[0.95] text-ink"
            >
              {config.prizeHeadline}
            </h2>
            {open && (
              <a
                href="#/inscribir"
                className="cta-live mt-6 inline-block rounded-xl bg-brand px-8 py-4 text-lg font-extrabold text-night"
              >
                Quiero ganarla
              </a>
            )}
          </div>
          {/* Cartelito: aparece al pasar por encima (en móvil, sin cursor, está siempre visible). */}
          <button
            type="button"
            onClick={() =>
              document
                .getElementById('como-participar')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className="prize-sign absolute right-4 top-[4.5rem] md:top-auto md:bottom-14 md:right-8 flex items-center gap-3 rounded-2xl bg-ink px-5 py-3 text-left font-extrabold text-night shadow-xl shadow-black/40"
          >
            <span className="leading-tight">
              Cómo participar
              <span className="block text-sm font-semibold text-night/70">
                Pasos y normas
              </span>
            </span>
            <svg
              className="prize-arrow h-7 w-7 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 4v15M6 13l6 6 6-6" />
            </svg>
          </button>
          {config.prizeImageIsPlaceholder && (
            <p className="absolute bottom-3 right-4 text-xs text-ink-soft/80">
              Foto ilustrativa
            </p>
          )}
        </div>
      </section>

      {/* Cómo participar */}
      <section id="como-participar" className="scroll-mt-20 mx-auto max-w-5xl px-4 py-16">
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
