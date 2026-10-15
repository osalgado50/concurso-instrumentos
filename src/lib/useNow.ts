import { useEffect, useState } from 'react';

/**
 * Reloj reactivo: hace que la interfaz cambie sola al llegar la hora de
 * apertura o de cierre, sin recargar la página.
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
