import { useEffect, useState } from 'react';
import { confirmParticipant } from '../lib/store';
import type { ConfirmResult } from '../lib/store';
import { confirmDeadline } from '../lib/state';
import { fmt } from '../lib/time';

type State = 'loading' | ConfirmResult;

export default function Confirmar({ token }: { token: string }) {
  const [state, setState] = useState<State>('loading');

  useEffect(() => {
    // confirmParticipant es idempotente: ejecutarlo dos veces (StrictMode) no duplica nada.
    setState(confirmParticipant(token));
  }, [token]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-2xl bg-night-soft border border-white/10 p-8">
        {state === 'loading' && <p className="text-ink-soft">Verificando…</p>}

        {state === 'ok' && (
          <>
            <h1 className="text-2xl font-black text-brand">¡Confirmado! Ya participas 🎸</h1>
            <p className="mt-3 text-ink-soft">
              Tu inscripción quedó confirmada. El día del sorteo elegimos al
              ganador al azar entre todas las participaciones confirmadas y
              publicamos el resultado aquí mismo.
            </p>
            <a
              href="#/"
              className="mt-6 inline-block rounded-xl bg-brand px-8 py-3 font-bold text-night hover:brightness-110 transition"
            >
              Volver al inicio
            </a>
          </>
        )}

        {state === 'already' && (
          <>
            <h1 className="text-2xl font-black">Ya estabas confirmado</h1>
            <p className="mt-3 text-ink-soft">
              Esta inscripción ya había sido confirmada. No hace falta hacer nada más.
            </p>
            <a
              href="#/"
              className="mt-6 inline-block rounded-xl border border-white/20 px-8 py-3 font-semibold hover:bg-white/5 transition"
            >
              Volver al inicio
            </a>
          </>
        )}

        {state === 'expired' && (
          <>
            <h1 className="text-2xl font-black">El plazo para confirmar terminó</h1>
            <p className="mt-3 text-ink-soft">
              Las confirmaciones se aceptaban hasta el {fmt(confirmDeadline())} (hora de
              Tijuana). Las inscripciones sin confirmar a tiempo no entran al sorteo.
            </p>
            <a
              href="#/"
              className="mt-6 inline-block rounded-xl border border-white/20 px-8 py-3 font-semibold hover:bg-white/5 transition"
            >
              Volver al inicio
            </a>
          </>
        )}

        {state === 'invalid' && (
          <>
            <h1 className="text-2xl font-black">Enlace no válido</h1>
            <p className="mt-3 text-ink-soft">
              No encontramos una inscripción para este enlace. Si acabas de
              inscribirte, revisa que el enlace esté completo; si el problema
              sigue, escríbenos.
            </p>
            <a
              href="#/inscribir"
              className="mt-6 inline-block rounded-xl bg-brand px-8 py-3 font-bold text-night hover:brightness-110 transition"
            >
              Ir a la inscripción
            </a>
          </>
        )}
      </div>
    </div>
  );
}
