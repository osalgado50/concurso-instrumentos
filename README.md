# Gran Concurso de Instrumentos — Landing

Landing del concurso para captar contactos de la tienda de instrumentos musicales en Tijuana: formulario mínimo, confirmación de correo, control de duplicados, cierre automático de inscripciones, panel de administración con exportación y sorteo demostrable.

## Tecnologías

React + Vite + Tailwind CSS. Los datos se guardan en el `localStorage` del navegador (sin backend): la lista de participantes, confirmaciones, permiso de comunicaciones y registro de sorteos viven en el navegador donde se inscriben.

## Desarrollo

```bash
npm install
npm run dev
```

## Compilación

```bash
npm run build
```

Genera `dist/`, listo para publicar (GitHub Pages, Netlify, etc.).

## Publicación en GitHub Pages

1. Sube el código a este repositorio.
2. En **Settings → Pages**, elige publicar desde la rama `main` (carpeta raíz) o con GitHub Actions.
3. La web quedará en `https://osalgado50.github.io/concurso-instrumentos/`.

## Configuración

Todo lo editable del concurso está en `src/config.ts`:

- Nombre de la tienda y ciudad (PROVISIONAL).
- Premio y su descripción (PROVISIONAL).
- Fecha de apertura, cierre y sorteo (PROVISIONALES).
- Código de acceso al panel de administración (**cámbialo antes de publicar**).
- Correo de contacto (PROVISIONAL).

El cierre también se puede ajustar desde el propio panel (Ajustes), sin tocar código.

## Panel de administración

Ruta `#/admin`. Código por defecto: el definido en `src/config.ts`. Permite ver participantes y confirmados, exportar CSV (todo, confirmados o permiso de comunicaciones), cambiar la fecha de cierre, cerrar inscripciones manualmente, hacer el sorteo entre confirmados, elegir suplentes y exportar el registro del sorteo.

## Notas importantes

- La confirmación por correo es simulada en esta versión: el enlace de confirmación se muestra al final del formulario. Para enviarlo de verdad hace falta un backend (por ejemplo, un servicio de correo).
- El `localStorage` guarda los datos solo en el navegador del visitante. En producción conviene pasar a un backend para centralizar la lista.
