import { useState } from 'react';
import { config } from '../config';
import { deadline, isClosed } from '../lib/state';
import {
  getParticipants,
  updateParticipant,
  deleteParticipant,
  getDraws,
  addDraw,
  resetDraws,
  getSettings,
  saveSettings,
  participantsCsv,
  uid,
} from '../lib/store';
import type { Participant, Draw } from '../types';

const ADMIN_KEY = 'concurso.adminSession';

function downloadCsv(name: string, csv: string) {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function fmt(d: string | Date) {
  return new Date(d).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function drawCsv(draws: Draw[]): string {
  const headers = ['fecha', 'tipo', 'ganador', 'correo_ganador', 'tamanio_bombo', 'participantes_bombo'];
  const rows = draws.map((d) =>
    [d.createdAt, d.kind, d.winnerNombre, d.winnerEmail, d.poolSize, d.poolIds.join(' ')]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

type Tab = 'resumen' | 'participantes' | 'sorteo' | 'ajustes';

export default function Admin() {
  const [authed, setAuthed] = useState(
    sessionStorage.getItem(ADMIN_KEY) === '1',
  );
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [tab, setTab] = useState<Tab>('resumen');
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  // Se leen de nuevo en cada render para que el panel refleje siempre
  // el estado guardado (el rerender() fuerza la actualización).
  const participants = getParticipants();
  const draws = getDraws();

  if (!authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <h1 className="text-2xl font-black text-center">Panel de administración</h1>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code === config.adminCode) {
              sessionStorage.setItem(ADMIN_KEY, '1');
              setAuthed(true);
            } else {
              setCodeError(true);
            }
          }}
        >
          <input
            type="password"
            className="w-full rounded-xl border border-white/15 bg-night-soft px-4 py-3"
            placeholder="Código de acceso"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeError(false);
            }}
          />
          {codeError && (
            <p className="text-sm text-red-300">Código incorrecto.</p>
          )}
          <button
            type="submit"
            className="w-full rounded-xl bg-brand px-6 py-3 font-bold text-night hover:brightness-110 transition"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  const confirmed = participants.filter((p) => p.status === 'confirmado');
  const pending = participants.filter((p) => p.status === 'pendiente');
  const winners = draws.map((d) => d.winnerId);
  const winnerSet = new Set(winners);
  const eligiblePool = confirmed.filter((p) => !winnerSet.has(p.id));
  const closed = isClosed();

  function selectWinner(kind: Draw['kind']) {
    if (eligiblePool.length === 0) return;
    const pool = eligiblePool;
    const idx = new Uint32Array(1);
    crypto.getRandomValues(idx);
    const winner = pool[idx[0] % pool.length];
    const draw: Draw = {
      id: uid(),
      createdAt: new Date().toISOString(),
      kind,
      winnerId: winner.id,
      winnerNombre: winner.nombre,
      winnerEmail: winner.email,
      poolSize: pool.length,
      poolIds: pool.map((p) => p.id),
      excludedIds: [...winnerSet],
    };
    addDraw(draw);
    rerender();
  }

  const lastWinner = draws.length > 0 ? draws[draws.length - 1] : null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'participantes', label: 'Participantes' },
    { id: 'sorteo', label: 'Sorteo' },
    { id: 'ajustes', label: 'Ajustes' },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Panel de administración</h1>
        <button
          onClick={() => {
            sessionStorage.removeItem(ADMIN_KEY);
            setAuthed(false);
          }}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
        >
          Salir
        </button>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              'rounded-lg px-4 py-2 text-sm font-semibold transition ' +
              (tab === t.id
                ? 'bg-brand text-night'
                : 'bg-night-soft text-ink-soft hover:bg-white/10')
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'resumen' && (
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Inscripciones', value: participants.length },
            { label: 'Confirmadas', value: confirmed.length },
            { label: 'Sin confirmar', value: pending.length },
            { label: 'Sorteos hechos', value: draws.length },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-2xl bg-night-soft border border-white/10 p-5"
            >
              <p className="text-sm text-ink-soft">{c.label}</p>
              <p className="mt-1 text-3xl font-black text-brand">{c.value}</p>
            </div>
          ))}
          <p className="sm:col-span-4 text-sm text-ink-soft">
            {closed
              ? 'Las inscripciones están cerradas.'
              : `Las inscripciones cierran automáticamente el ${fmt(deadline())}.`}
            {' '}Los sin confirmar no participan en el sorteo.
          </p>
        </div>
      )}

      {tab === 'participantes' && (
        <div className="mt-8">
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => downloadCsv('participantes.csv', participantsCsv(participants))}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-night hover:brightness-110"
            >
              Exportar todo (CSV)
            </button>
            <button
              onClick={() => downloadCsv('confirmados.csv', participantsCsv(confirmed))}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/5"
            >
              Exportar confirmados (CSV)
            </button>
            <button
              onClick={() => downloadCsv('permiso-comunicaciones.csv', participantsCsv(participants.filter((p) => p.commsOptIn)))}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/5"
            >
              Exportar permiso de comunicaciones (CSV)
            </button>
          </div>

          {participants.length === 0 ? (
            <p className="text-ink-soft">Todavía no hay inscripciones.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-night-soft text-left text-ink-soft">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Correo</th>
                    <th className="p-3">Teléfono</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Inscrito</th>
                    <th className="p-3">Comunic.</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-t border-white/10">
                      <td className="p-3">{p.nombre}</td>
                      <td className="p-3 break-all">{p.email}</td>
                      <td className="p-3">{p.telefono || '—'}</td>
                      <td className="p-3">
                        <span
                          className={
                            'rounded-full px-2 py-0.5 text-xs font-semibold ' +
                            (p.status === 'confirmado'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-amber-500/20 text-amber-300')
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">{fmt(p.createdAt)}</td>
                      <td className="p-3">{p.commsOptIn ? 'sí' : 'no'}</td>
                      <td className="p-3 text-right">
                        {p.status === 'pendiente' && (
                          <button
                            onClick={() => {
                              updateParticipant(p.id, {
                                status: 'confirmado',
                                confirmedAt: new Date().toISOString(),
                              });
                              rerender();
                            }}
                            className="mr-2 text-brand underline"
                          >
                            Confirmar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar la inscripción de ${p.nombre}?`)) {
                              deleteParticipant(p.id);
                              rerender();
                            }
                          }}
                          className="text-red-300 underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'sorteo' && (
        <div className="mt-8 space-y-6">
          {!closed ? (
            <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-amber-200">
              El sorteo se habilita cuando cierren las inscripciones
              ({fmt(deadline())}) o cuando las cierres manualmente en Ajustes.
            </p>
          ) : (
            <div className="rounded-2xl bg-night-soft border border-white/10 p-6">
              <p className="text-ink-soft">
                Bombo actual: {eligiblePool.length} participaciones confirmadas
                {winners.length > 0 && ' (sin los ya premiados)'}.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {draws.length === 0 ? (
                  <button
                    onClick={() => selectWinner('ganador')}
                    disabled={eligiblePool.length === 0}
                    className="rounded-xl bg-brand px-6 py-3 font-bold text-night hover:brightness-110 disabled:opacity-40"
                  >
                    Seleccionar ganador al azar
                  </button>
                ) : (
                  <button
                    onClick={() => selectWinner('suplente')}
                    disabled={eligiblePool.length === 0}
                    className="rounded-xl border border-brand/50 px-6 py-3 font-bold text-brand hover:bg-brand/10 disabled:opacity-40"
                  >
                    Elegir suplente
                  </button>
                )}
                {lastWinner && (
                  <a
                    href={`mailto:${encodeURIComponent(lastWinner.winnerEmail)}?subject=${encodeURIComponent(`¡Ganaste el ${config.title}!`)}&body=${encodeURIComponent(`Hola ${lastWinner.winnerNombre},\n\n¡Felicidades! Tu correo fue seleccionado al azar como ganador del ${config.title} el ${fmt(lastWinner.createdAt)}.\n\nEscríbenos a ${config.contactEmail} o visítanos para coordinar la entrega de tu premio.\n\n${config.storeName}`)}`}
                    className="rounded-xl border border-white/20 px-6 py-3 font-semibold hover:bg-white/5"
                  >
                    Escribir al ganador por correo
                  </a>
                )}
              </div>
              {eligiblePool.length === 0 && draws.length > 0 && (
                <p className="mt-3 text-sm text-ink-soft">
                  No quedan más participantes en el bombo.
                </p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Registro del sorteo</h2>
              {draws.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadCsv('registro-sorteo.csv', drawCsv(draws))}
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5"
                  >
                    Exportar registro (CSV)
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Borrar el registro de sorteos? Esta acción no se puede deshacer.')) {
                        resetDraws();
                        rerender();
                      }
                    }}
                    className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10"
                  >
                    Borrar registro
                  </button>
                </div>
              )}
            </div>
            {draws.length === 0 ? (
              <p className="mt-2 text-ink-soft">
                Aún no se ha realizado ningún sorteo. Cada selección quedará
                registrada aquí con fecha, bombo y resultado.
              </p>
            ) : (
              <ol className="mt-3 space-y-3">
                {[...draws].reverse().map((d, i) => (
                  <li
                    key={d.id}
                    className="rounded-2xl bg-night-soft border border-white/10 p-4"
                  >
                    <p className="font-bold text-brand">
                      {d.kind === 'ganador' ? 'Ganador' : `Suplente ${draws.length - i - 1}`}{' '}
                      · {fmt(d.createdAt)}
                    </p>
                    <p className="mt-1">
                      {d.winnerNombre} — {d.winnerEmail}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Bombo: {d.poolSize} participaciones confirmadas
                      {d.excludedIds.length > 0 &&
                        ` · excluidos: ${d.excludedIds.length} ya premiados`}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}

      {tab === 'ajustes' && (
        <SettingsTab rerender={rerender} />
      )}
    </div>
  );
}

function SettingsTab({ rerender }: { rerender: () => void }) {
  const s = getSettings();
  const [dl, setDl] = useState(
    (s.deadlineOverride ?? config.endDate).slice(0, 16),
  );

  return (
    <div className="mt-8 space-y-6 max-w-lg">
      <div className="rounded-2xl bg-night-soft border border-white/10 p-6">
        <h2 className="font-bold">Fecha y hora de cierre</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Las inscripciones se cierran solas en esta fecha, sin que nadie tenga
          que tocar nada.
        </p>
        <input
          type="datetime-local"
          value={dl}
          onChange={(e) => setDl(e.target.value)}
          className="mt-4 w-full rounded-xl border border-white/15 bg-night px-4 py-3"
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => {
              saveSettings({ ...getSettings(), deadlineOverride: dl });
              rerender();
            }}
            className="rounded-xl bg-brand px-5 py-2.5 font-bold text-night hover:brightness-110"
          >
            Guardar
          </button>
          <button
            onClick={() => {
              saveSettings({ ...getSettings(), deadlineOverride: undefined });
              setDl(config.endDate.slice(0, 16));
              rerender();
            }}
            className="rounded-xl border border-white/20 px-5 py-2.5 hover:bg-white/5"
          >
            Usar la fecha de las bases
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-night-soft border border-white/10 p-6">
        <h2 className="font-bold">Cierre manual</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Cierra las inscripciones de inmediato, antes de la fecha programada.
        </p>
        <button
          onClick={() => {
            saveSettings({ ...getSettings(), closedOverride: !s.closedOverride });
            rerender();
          }}
          className={
            'mt-4 rounded-xl px-5 py-2.5 font-bold ' +
            (s.closedOverride
              ? 'bg-green-500/80 text-night hover:brightness-110'
              : 'bg-red-500/80 text-night hover:brightness-110')
          }
        >
          {s.closedOverride ? 'Reabrir inscripciones' : 'Cerrar inscripciones ahora'}
        </button>
      </div>
    </div>
  );
}
