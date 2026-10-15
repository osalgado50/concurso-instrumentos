import { useState } from 'react';
import { addParticipant } from '../lib/store';
import { isOpen } from '../lib/state';
import type { Participant } from '../types';

const inputCls =
  'w-full rounded-xl border border-white/15 bg-night-soft px-4 py-3 text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-brand';

export default function Inscribir() {
  const open = isOpen();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [bases, setBases] = useState(false);
  const [comms, setComms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Participant | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!open) {
      setError('Las inscripciones están cerradas.');
      return;
    }
    if (nombre.trim().length < 2 || nombre.trim().length > 100) {
      setError('Escribe tu nombre completo (entre 2 y 100 caracteres).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Escribe un correo electrónico válido.');
      return;
    }
    if (telefono.trim().length > 20) {
      setError('El teléfono es demasiado largo.');
      return;
    }
    if (!bases) {
      setError('Para participar debes aceptar las bases y el aviso de privacidad.');
      return;
    }
    const p = addParticipant({
      nombre: nombre.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      consentBases: true,
      commsOptIn: comms,
    });
    if (!p) {
      setError('Ese correo ya está inscrito. Cada correo participa una sola vez.');
      return;
    }
    setDone(p);
  }

  if (done) {
    const link = `${window.location.origin}${window.location.pathname}#/confirmar?t=${done.token}`;
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-2xl bg-night-soft border border-brand/30 p-8">
          <h1 className="text-2xl font-black">¡Inscripción recibida!</h1>
          <p className="mt-3 text-ink-soft">
            Falta un paso: confirma tu correo. En la versión final, este enlace
            te llega por correo electrónico; por ahora lo ves aquí mismo.
          </p>
          <p className="mt-4 break-all rounded-lg bg-night p-3 text-sm">
            {link}
          </p>
          <a
            href={`#/confirmar?t=${done.token}`}
            className="mt-6 inline-block rounded-xl bg-brand px-8 py-3 font-bold text-night hover:brightness-110 transition"
          >
            Confirmar mi participación
          </a>
          <p className="mt-6 text-sm text-ink-soft">
            Recuerda: solo participan las inscripciones confirmadas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-black text-center">Inscripción</h1>
      <p className="mt-2 text-center text-ink-soft">
        Menos de un minuto. Sin compra necesaria.
      </p>

      {!open && (
        <p className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-center text-red-200">
          Las inscripciones están cerradas en este momento.
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-xl border border-red-400/40 bg-red-400/10 p-4 text-red-200">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <div>
          <label htmlFor="nombre" className="block text-sm font-semibold mb-1">
            Nombre completo
          </label>
          <input
            id="nombre"
            className={inputCls}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={100}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold mb-1">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            className={inputCls}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            autoComplete="email"
            inputMode="email"
          />
        </div>
        <div>
          <label htmlFor="tel" className="block text-sm font-semibold mb-1">
            Teléfono <span className="font-normal text-ink-soft">(opcional)</span>
          </label>
          <input
            id="tel"
            type="tel"
            className={inputCls}
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            maxLength={20}
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        {/* Consentimiento obligatorio */}
        <label className="flex items-start gap-3 rounded-xl border border-white/15 bg-night-soft p-4 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-[oklch(0.8_0.16_75)]"
            checked={bases}
            onChange={(e) => setBases(e.target.checked)}
          />
          <span>
            He leído y acepto las{' '}
            <a href="#/bases" className="text-brand underline">
              bases del concurso
            </a>{' '}
            y el aviso de privacidad. Obligatorio para participar.
          </span>
        </label>

        {/* Permiso de comunicaciones: separado y opcional */}
        <label className="flex items-start gap-3 rounded-xl border border-white/15 bg-night-soft p-4 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 accent-[oklch(0.8_0.16_75)]"
            checked={comms}
            onChange={(e) => setComms(e.target.checked)}
          />
          <span>
            Quiero recibir noticias, promociones y novedades de la tienda.
            Opcional y independiente del concurso.
          </span>
        </label>

        <button
          type="submit"
          disabled={!open}
          className="w-full rounded-xl bg-brand px-6 py-4 text-lg font-bold text-night hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Inscribirme
        </button>
        <p className="text-center text-xs text-ink-soft">
          Una participación por correo. Después te pedimos confirmar tu correo.
        </p>
      </form>
    </div>
  );
}
