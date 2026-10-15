import { useEffect, useState } from 'react';
import Landing from './components/Landing';
import Bases from './components/Bases';
import Inscribir from './components/Inscribir';
import Confirmar from './components/Confirmar';
import Admin from './components/Admin';
import { config } from './config';

export type Route =
  | { name: 'inicio' }
  | { name: 'bases' }
  | { name: 'inscribir' }
  | { name: 'confirmar'; token: string }
  | { name: 'admin' };

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, qs] = raw.split('?');
  const query = new URLSearchParams(qs ?? '');
  switch (path) {
    case 'bases':
      return { name: 'bases' };
    case 'inscribir':
      return { name: 'inscribir' };
    case 'confirmar':
      return { name: 'confirmar', token: query.get('t') ?? '' };
    case 'admin':
      return { name: 'admin' };
    default:
      return { name: 'inicio' };
  }
}

export function navigate(to: string) {
  window.location.hash = to;
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 backdrop-blur bg-night/85 border-b border-white/10">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-4">
          <a href="#/" className="font-bold tracking-tight text-brand">
            {config.storeName}
          </a>
          <nav className="flex items-center gap-1 text-sm">
            <a className="px-3 py-2 rounded-lg hover:bg-white/10" href="#/">
              Inicio
            </a>
            <a className="px-3 py-2 rounded-lg hover:bg-white/10" href="#/bases">
              Bases
            </a>
            <a
              className="px-3 py-2 rounded-lg bg-brand text-night font-semibold hover:brightness-110"
              href="#/inscribir"
            >
              Participar
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {route.name === 'inicio' && <Landing />}
        {route.name === 'bases' && <Bases />}
        {route.name === 'inscribir' && <Inscribir />}
        {route.name === 'confirmar' && <Confirmar token={route.token} />}
        {route.name === 'admin' && <Admin />}
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-ink-soft">
        <p className="font-semibold text-ink">
          {config.title} · {config.city}
        </p>
        <p className="mt-1">
          Dudas y consultas: {config.contactEmail} · Organiza {config.storeName}
        </p>
        <p className="mt-3 text-xs">
          Sin compra necesaria. Consulta las{' '}
          <a className="underline hover:text-brand" href="#/bases">
            bases legales
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
