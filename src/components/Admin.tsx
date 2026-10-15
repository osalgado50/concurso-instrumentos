import { useEffect, useState } from 'react';
import { config } from '../config';
import { deadline, isClosed, confirmDeadline, drawEnabled, scheduledDeadline } from '../lib/state';
import {
  getParticipants,
  getConsents,
  getDraws,
  getAudit,
  getSettings,
  confirmManually,
  removeParticipant,
  setDeadlineOverride,
  closeNow,
  reopen,
  isFrozen,
} from '../lib/store';
import { performDraw, verifyChain } from '../lib/draw';
import { participantsCsv, drawCsv, auditCsv } from '../lib/csv';
import { fmtShort, fmt, toZonedInput, fromZonedInput } from '../lib/time';
import { useNow } from '../lib/useNow';
import { confirmationEmail, winnerEmail } from '../lib/emails';
import { autoSeedIfEmpty, seedDemo, clearAll, getDemoState } from '../lib/demo';
import type { Draw } from '../types';

const ADMIN_KEY = 'concurso.adminSession';

function downloadCsv(name: string, csv: string) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

type Tab = 'resumen' | 'participantes' | 'sorteo' | 'correos' | 'ajustes' | 'auditoria';

export default function Admin() {
  const [authed, setAuthed] = useState(sessionStorage.getItem(ADMIN_KEY) === '1');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [tab, setTab] = useState<Tab>('resumen');
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);
  const now = useNow();

  // Se leen de nuevo en cada render para que el panel refleje siempre el estado guardado.
  const participants = getParticipants();
  const consents = getConsents();
  const draws = getDraws();

  // Primera visita al panel sin datos: se cargan inscripciones de ejemplo (ver lib/demo.ts).
  useEffect(() => {
    if (authed && autoSeedIfEmpty()) rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const [chain, setChain] = useState<{ ok: boolean; brokenAt?: number } | null>(null);
  useEffect(() => {
    let alive = true;
    verifyChain(draws).then((r) => alive && setChain(r));
    return () => {
      alive = false;
    };
  }, [draws.length, draws[draws.length - 1]?.hash]);

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
            aria-label="Código de acceso"
            className="w-full rounded-xl border border-white/15 bg-night-soft px-4 py-3"
            placeholder="Código de acceso"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setCodeError(false);
            }}
          />
          {codeError && <p className="text-sm text-red-300">Código incorrecto.</p>}
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
  const manual = confirmed.filter((p) => p.confirmMethod === 'manual');
  const winnerSet = new Set(draws.map((d) => d.winnerId));
  const eligiblePool = confirmed.filter((p) => !winnerSet.has(p.id));
  const closed = isClosed(now);
  const enabled = drawEnabled(now);
  const frozen = isFrozen();
  const lastDraw = draws.length > 0 ? draws[draws.length - 1] : null;

  async function doDraw() {
    const r = await performDraw();
    if (!r.ok) {
      alert(
        r.reason === 'not_enabled'
          ? 'El sorteo aún no está habilitado.'
          : r.reason === 'empty'
            ? 'No quedan participantes confirmados en el bombo.'
            : 'Hay otro sorteo en curso. Inténtalo de nuevo.',
      );
    }
    rerender();
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'participantes', label: 'Participantes' },
    { id: 'sorteo', label: 'Sorteo' },
    { id: 'correos', label: 'Correos' },
    { id: 'ajustes', label: 'Ajustes' },
    { id: 'auditoria', label: 'Actividad' },
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

      {config.demoTools && (
        <div
          role="status"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3 text-sm"
        >
          <p>
            <strong>Modo demostración.</strong>{' '}
            {getDemoState() === 'seeded'
              ? 'Estás viendo inscripciones ficticias para probar el panel, las exportaciones y el sorteo.'
              : participants.length === 0
                ? 'El panel está vacío. Puedes cargar inscripciones ficticias para probarlo.'
                : 'Estás viendo las inscripciones reales hechas en este navegador. Puedes sustituirlas por datos de ejemplo para probar el sorteo.'}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (
                  confirm(
                    'Se sustituirán los datos actuales de este navegador por inscripciones de ejemplo. ¿Continuar?',
                  )
                ) {
                  seedDemo();
                  rerender();
                }
              }}
              className="rounded-lg bg-brand px-3 py-1.5 font-semibold text-night hover:brightness-110"
            >
              {getDemoState() === 'seeded' ? 'Recargar datos de ejemplo' : 'Cargar datos de ejemplo'}
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    'Se borrarán TODOS los datos del concurso guardados en este navegador (inscripciones, sorteos y actividad). ¿Continuar?',
                  )
                ) {
                  clearAll();
                  rerender();
                }
              }}
              className="rounded-lg border border-white/25 px-3 py-1.5 font-semibold hover:bg-white/10"
            >
              Borrar todo y empezar de cero
            </button>
          </div>
        </div>
      )}

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
            <div key={c.label} className="rounded-2xl bg-night-soft border border-white/10 p-5">
              <p className="text-sm text-ink-soft">{c.label}</p>
              <p className="mt-1 text-3xl font-black text-brand">{c.value}</p>
            </div>
          ))}
          <p className="sm:col-span-4 text-sm text-ink-soft">
            {closed
              ? `Las inscripciones cerraron el ${fmt(deadline())}.`
              : `Las inscripciones cierran automáticamente el ${fmt(deadline())} (hora de Tijuana).`}{' '}
            Los sin confirmar no participan en el sorteo.
            {manual.length > 0 &&
              ` Hay ${manual.length} confirmación(es) manual(es) hechas desde este panel.`}
          </p>
        </div>
      )}

      {tab === 'participantes' && (
        <div className="mt-8">
          {frozen && (
            <p className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
              Ya se hizo un sorteo: la lista de participantes está congelada
              (no se puede confirmar a mano ni eliminar).
            </p>
          )}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => downloadCsv('participantes.csv', participantsCsv(participants, consents))}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-night hover:brightness-110"
            >
              Exportar todo (CSV)
            </button>
            <button
              onClick={() => downloadCsv('confirmados.csv', participantsCsv(confirmed, consents))}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/5"
            >
              Exportar confirmados (CSV)
            </button>
            <button
              onClick={() =>
                downloadCsv(
                  'permiso-comunicaciones.csv',
                  participantsCsv(
                    participants.filter((p) => consents.find((c) => c.participantId === p.id)?.comms.accepted),
                    consents,
                  ),
                )
              }
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
                  {participants.map((p) => {
                    const c = consents.find((x) => x.participantId === p.id);
                    return (
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
                            {p.confirmMethod === 'manual' ? ' (manual)' : ''}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">{fmtShort(p.createdAt)}</td>
                        <td className="p-3">{c?.comms.accepted ? 'sí' : 'no'}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          {!frozen && p.status === 'pendiente' && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `¿Confirmar a ${p.nombre} sin que haya confirmado su correo?\n\nSe salta la doble confirmación; quedará marcado como "manual" y anotado en la actividad.`,
                                  )
                                ) {
                                  confirmManually(p.id);
                                  rerender();
                                }
                              }}
                              className="mr-2 text-brand underline"
                            >
                              Confirmar a mano
                            </button>
                          )}
                          {!frozen && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar la inscripción de ${p.nombre}?`)) {
                                  removeParticipant(p.id);
                                  rerender();
                                }
                              }}
                              className="text-red-300 underline"
                            >
                              Eliminar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
              El sorteo se habilita cuando cierren las inscripciones ({fmt(deadline())}) y termine
              el margen de {config.confirmGraceHours} h para confirmar el correo.
            </p>
          ) : !enabled ? (
            <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-amber-200">
              Las inscripciones están cerradas. El sorteo se habilita el{' '}
              {fmt(confirmDeadline())}, cuando termina el plazo para confirmar el correo.
            </p>
          ) : (
            <div className="rounded-2xl bg-night-soft border border-white/10 p-6">
              <p className="text-ink-soft">
                Bombo actual: {eligiblePool.length} participaciones confirmadas
                {winnerSet.size > 0 && ' (sin los ya premiados)'}.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    if (
                      confirm(
                        draws.length === 0
                          ? '¿Hacer el sorteo ahora? Quedará registrado y no se podrá borrar.'
                          : '¿Elegir un suplente? Quedará registrado y no se podrá borrar.',
                      )
                    ) {
                      void doDraw();
                    }
                  }}
                  disabled={eligiblePool.length === 0}
                  className={
                    draws.length === 0
                      ? 'rounded-xl bg-brand px-6 py-3 font-bold text-night hover:brightness-110 disabled:opacity-40'
                      : 'rounded-xl border border-brand/50 px-6 py-3 font-bold text-brand hover:bg-brand/10 disabled:opacity-40'
                  }
                >
                  {draws.length === 0 ? 'Seleccionar ganador al azar' : 'Elegir suplente'}
                </button>
                {lastDraw && (() => {
                  // Mismo texto que la plantilla de la pestaña "Correos".
                  const m = winnerEmail(
                    { nombre: lastDraw.winnerNombre },
                    lastDraw.kind,
                    new Date(lastDraw.createdAt),
                  );
                  return (
                    <a
                      href={`mailto:${encodeURIComponent(lastDraw.winnerEmail)}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`}
                      className="rounded-xl border border-white/20 px-6 py-3 font-semibold hover:bg-white/5"
                    >
                      Escribir al ganador por correo
                    </a>
                  );
                })()}
              </div>
              {eligiblePool.length === 0 && draws.length > 0 && (
                <p className="mt-3 text-sm text-ink-soft">No quedan más participantes en el bombo.</p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-bold">Registro del sorteo</h2>
              {draws.length > 0 && (
                <button
                  onClick={() => downloadCsv('registro-sorteo.csv', drawCsv(draws))}
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5"
                >
                  Exportar registro (CSV)
                </button>
              )}
            </div>
            {draws.length === 0 ? (
              <p className="mt-2 text-ink-soft">
                Aún no se ha realizado ningún sorteo. Cada selección quedará registrada aquí
                con fecha, bombo, resultado y huella, y no se podrá borrar.
              </p>
            ) : (
              <>
                <p
                  className={
                    'mt-3 rounded-xl border p-3 text-sm ' +
                    (chain?.ok === false
                      ? 'border-red-400/40 bg-red-400/10 text-red-200'
                      : 'border-green-400/30 bg-green-400/10 text-green-200')
                  }
                  role="status"
                >
                  {chain === null
                    ? 'Verificando la integridad del registro…'
                    : chain.ok
                      ? 'Integridad verificada: las huellas encadenadas coinciden.'
                      : `¡El registro NO coincide con sus huellas (selección nº ${chain.brokenAt})! Ha sido alterado.`}
                </p>
                {lastDraw && (
                  <p className="mt-2 text-xs text-ink-soft break-all">
                    Huella final (publícala junto con el resultado para que cualquiera pueda
                    comprobarlo): <span className="font-mono text-ink">{lastDraw.hash}</span>
                  </p>
                )}
                <ol className="mt-3 space-y-3">
                  {[...draws].reverse().map((d) => (
                    <li key={d.id} className="rounded-2xl bg-night-soft border border-white/10 p-4">
                      <p className="font-bold text-brand">
                        {d.kind === 'ganador' ? 'Ganador' : `Suplente ${d.order - 1}`} ·{' '}
                        {fmt(d.createdAt)}
                      </p>
                      <p className="mt-1">
                        {d.winnerNombre} — {d.winnerEmail}
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">
                        Bombo: {d.poolSize} participaciones confirmadas
                        {d.excludedIds.length > 0 && ` · excluidos: ${d.excludedIds.length} ya premiados`}
                      </p>
                      <p className="mt-1 text-xs text-ink-soft font-mono break-all">
                        huella del bombo {d.poolHash.slice(0, 16)}… · huella {d.hash.slice(0, 16)}…
                      </p>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'correos' && <EmailsTab lastDraw={lastDraw} />}

      {tab === 'ajustes' && <SettingsTab rerender={rerender} frozen={frozen} />}

      {tab === 'auditoria' && (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold">Registro de actividad del panel</h2>
            <button
              onClick={() => downloadCsv('actividad.csv', auditCsv(getAudit()))}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5"
            >
              Exportar (CSV)
            </button>
          </div>
          <p className="mt-2 text-sm text-ink-soft">
            Cambios de fecha, cierres y reaperturas, confirmaciones manuales, eliminaciones y
            sorteos. No se puede borrar desde el panel.
          </p>
          {getAudit().length === 0 ? (
            <p className="mt-4 text-ink-soft">Sin actividad registrada.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {[...getAudit()].reverse().map((a) => (
                <li key={a.id} className="rounded-xl bg-night-soft border border-white/10 p-3">
                  <span className="text-ink-soft">{fmtShort(a.at)}</span> ·{' '}
                  <strong>{a.action}</strong> — {a.detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Plantillas de correo listas para el envío real. Aquí solo se previsualizan y se copian. */
function EmailsTab({ lastDraw }: { lastDraw: Draw | null }) {
  const [copied, setCopied] = useState<string | null>(null);
  const confirmation = confirmationEmail(
    { nombre: 'Ana López' },
    `${window.location.origin}${window.location.pathname}#/confirmar?t=EJEMPLO`,
    confirmDeadline(),
  );
  const winner = winnerEmail(
    { nombre: lastDraw?.winnerNombre ?? 'Ana López' },
    lastDraw?.kind ?? 'ganador',
    lastDraw ? new Date(lastDraw.createdAt) : new Date(config.drawDate),
  );

  async function copy(id: string, t: { subject: string; body: string }) {
    try {
      await navigator.clipboard.writeText(`Asunto: ${t.subject}\n\n${t.body}`);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  const items = [
    { id: 'confirmacion', title: 'Confirmación de inscripción', t: confirmation },
    {
      id: 'ganador',
      title: lastDraw
        ? `Aviso a ${lastDraw.kind === 'suplente' ? 'suplente' : 'ganador/a'} (último sorteo)`
        : 'Aviso a ganador/a (ejemplo)',
      t: winner,
    },
  ];

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold">Plantillas de correo</h2>
      <p className="mt-2 text-sm text-ink-soft">
        En esta versión los correos no se envían: la persona ve su correo de confirmación en
        pantalla y tú copias el aviso al ganador desde aquí. Cuando se conecte el servicio de
        envío, se usan estos mismos textos (están en <code>src/lib/emails.ts</code>).
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {items.map((it) => (
          <div key={it.id} className="rounded-2xl border border-white/10 bg-night-soft p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">{it.title}</h3>
              <button
                onClick={() => copy(it.id, it.t)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:bg-white/5"
              >
                {copied === it.id ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="mt-3 text-sm">
              <span className="text-ink-soft">Asunto:</span> {it.t.subject}
            </p>
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-night p-4 text-sm font-sans leading-relaxed">
              {it.t.body}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsTab({ rerender, frozen }: { rerender: () => void; frozen: boolean }) {
  const s = getSettings();
  const [dl, setDl] = useState(toZonedInput(scheduledDeadline()));

  return (
    <div className="mt-8 space-y-6 max-w-lg">
      {frozen && (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-amber-200">
          Ya se hizo un sorteo: los ajustes están bloqueados para que nadie pueda reabrir ni
          mover el cierre después del resultado.
        </p>
      )}
      <div className="rounded-2xl bg-night-soft border border-white/10 p-6">
        <h2 className="font-bold">Fecha y hora de cierre (hora de Tijuana)</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Las inscripciones se cierran solas en esta fecha, sin que nadie tenga que tocar nada.
          Cada cambio queda anotado en la actividad.
        </p>
        <input
          type="datetime-local"
          aria-label="Fecha y hora de cierre"
          value={dl}
          disabled={frozen}
          onChange={(e) => setDl(e.target.value)}
          className="mt-4 w-full rounded-xl border border-white/15 bg-night px-4 py-3 disabled:opacity-50"
        />
        <div className="mt-4 flex gap-3">
          <button
            disabled={frozen || !dl}
            onClick={() => {
              setDeadlineOverride(fromZonedInput(dl));
              rerender();
            }}
            className="rounded-xl bg-brand px-5 py-2.5 font-bold text-night hover:brightness-110 disabled:opacity-40"
          >
            Guardar
          </button>
          <button
            disabled={frozen}
            onClick={() => {
              setDeadlineOverride(null);
              setDl(toZonedInput(new Date(config.endDate)));
              rerender();
            }}
            className="rounded-xl border border-white/20 px-5 py-2.5 hover:bg-white/5 disabled:opacity-40"
          >
            Usar la fecha de las bases
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-night-soft border border-white/10 p-6">
        <h2 className="font-bold">Cierre manual</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Cierra las inscripciones de inmediato, antes de la fecha programada. El margen para
          confirmar el correo ({config.confirmGraceHours} h) empieza a contar desde este momento.
        </p>
        <button
          disabled={frozen}
          onClick={() => {
            if (s.closedAt) reopen();
            else closeNow();
            rerender();
          }}
          className={
            'mt-4 rounded-xl px-5 py-2.5 font-bold disabled:opacity-40 ' +
            (s.closedAt
              ? 'bg-green-500/80 text-night hover:brightness-110'
              : 'bg-red-500/80 text-night hover:brightness-110')
          }
        >
          {s.closedAt ? 'Reabrir inscripciones' : 'Cerrar inscripciones ahora'}
        </button>
      </div>
    </div>
  );
}
