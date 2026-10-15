# Gran Concurso de Instrumentos

Landing de concurso para una tienda de instrumentos musicales de Tijuana (México). Objetivo: **captar contactos de verdad** con un concurso sencillo y transparente: sin inscripciones repetidas, con bases y consentimiento claros, con doble confirmación para que la lista sea real y con un sorteo que se pueda demostrar.

- **Previsualización (Vercel):** https://concurso-instrumentos.vercel.app/
- **Previsualización (GitHub Pages):** https://osalgado50.github.io/concurso-instrumentos/
- **Repositorio:** https://github.com/osalgado50/concurso-instrumentos
- **Panel de administración:** `/admin` (clave de demo más abajo)

> **Estado:** demostración funcional completa según el encargo (React + `localStorage` + Lovable, sin backend). Los materiales del cliente aún no existen: la web usa datos ficticios realistas, listados en [Materiales del cliente pendientes](#materiales-del-cliente-pendientes-datos-ficticios-en-su-lugar). El envío real de correos y el backend definitivo se conectan en el pulido final.

---

## Criterios de aceptación

| # | Criterio | Estado | Cómo se comprueba |
|---|---|---|---|
| 1 | Un correo solo puede inscribirse una vez, aunque cambie mayúsculas o espacios | Cumplido | El correo se normaliza antes de comparar: Unicode NFKC, sin espacios y en minúsculas. En Gmail/Googlemail también se ignoran los puntos y la etiqueta tras «+». Tests en `tests/concurso.test.ts`. |
| 2 | Una inscripción sin confirmar no participa | Cumplido | Solo las inscripciones confirmadas entran al bombo del sorteo. Test: una inscripción pendiente nunca aparece en el bombo. |
| 3 | Las inscripciones se cierran solas en la fecha y hora indicadas | Cumplido | La fecha se comprueba **al guardar** cada inscripción (un formulario que se quedó abierto ya no puede inscribir) y la pantalla se cierra sola al llegar la hora. Fechas con zona horaria (`America/Tijuana`). Tests en el instante exacto del cierre. |
| 4 | La selección de ganador registra fecha, participantes y resultado, y se puede repetir para suplentes | Cumplido | Cada sorteo guarda fecha, ids y huella SHA-256 del bombo, excluidos, algoritmo y resultado, encadenado con el anterior. Los suplentes excluyen a quien ya salió. El panel verifica la cadena. |
| 5 | El permiso de comunicaciones se guarda por separado del consentimiento de bases | Cumplido | Dos casillas distintas y dos registros distintos, cada uno con su fecha (el de bases, con la versión aceptada). Rechazar las comunicaciones no impide participar. |
| 6 | Carga en menos de dos segundos en móvil | Cumplido en medición | Lighthouse en modo móvil (red 4G lenta, CPU ralentizada) sobre la web publicada, 15-oct-2026: puntuación 99–100, primer contenido 1,3 s, contenido principal 1,7 s, interactiva 1,7 s, sin saltos de diseño. JS de 84 kB comprimido; foto de portada en WebP de 90 kB. |
| 7 | Repositorio en GitHub o proyecto transferido en Lovable, con URL de previsualización funcionando | Cumplido | Repositorio en GitHub y dos URLs de previsualización (arriba). |

Además del encargo: teléfono opcional que solo admite números y símbolos de marcación (`+ ( ) - # *`), correo de confirmación y aviso al ganador preparados, y registro de actividad del panel.

### Alcance de la demostración (importante para revisar los criterios 2 y 3)

Al no haber backend, estas dos garantías son completas en la lógica pero tienen un límite técnico que se resuelve al conectar el servidor:

- **Criterio 2:** la confirmación por correo es **simulada**: la persona ve el correo en pantalla con su enlace. Hasta que se envíe por correo real, cualquiera podría «confirmar» un correo que no es suyo.
- **Criterio 3:** el cierre automático usa la hora del dispositivo del visitante. Con servidor se usaría la hora del servidor.
- **Criterio 1:** la comprobación de duplicados es por navegador, no entre dispositivos.

---

## Qué está simulado y cómo se comporta

Esta versión no tiene backend. Esto es lo que es simulado, lo que no existe y lo que es real:

| Funcionalidad | Estado | Cómo se comporta |
|---|---|---|
| **Correo de confirmación** | Simulado | No se envía nada. Al inscribirse, la persona ve en pantalla el correo que recibiría (asunto, texto y enlace) y un botón para confirmar. El enlace funciona igual que funcionaría el del correo real. |
| **Correo al ganador o suplente** | Simulado | No se envía. En la pestaña Sorteo hay un botón «Escribir al ganador por correo» que abre el cliente de correo del administrador con el texto ya redactado, y la pestaña Correos permite copiarlo. |
| **Acceso al panel** | Simulado | Una clave de demo (`tijuana2026`) comprobada en el navegador. No es seguridad real. |
| **Base de datos** | Simulada con `localStorage` | Todo se guarda en el navegador de quien lo usa; no se comparte entre dispositivos ni con el panel de la tienda. |
| **Hora de cierre** | Con la hora del dispositivo | El cierre automático se calcula con el reloj del dispositivo del visitante. |
| **Pagos** | No existen | El encargo excluye sorteos con compra o pago: participar es gratis. |
| **WhatsApp y redes sociales** | No existen | El encargo excluye mecánicas que dependan de redes. No hay integración con WhatsApp ni se pide seguir cuentas. |
| Sorteo, duplicados, consentimientos, cierre, exportaciones | **Reales** | Funcionan de verdad dentro del navegador, con las salvedades de la sección «Alcance de la demostración». |

## Datos de ejemplo y cómo reiniciarlos

El panel viene con **20 inscripciones ficticias** (16 confirmadas y 4 sin confirmar, 11 con permiso de comunicaciones, con y sin permiso de comunicaciones, con y sin teléfono; nombres y correos inventados con el dominio `ejemplo.mx`).

- **Se cargan solas** la primera vez que se entra al panel en un navegador sin datos. Al entrar verás la barra «Modo demostración».
- **Recargarlas:** botón «Cargar datos de ejemplo» (o «Recargar datos de ejemplo») de esa barra. Sustituye lo que haya guardado en el navegador.
- **Empezar de cero:** botón «Borrar todo y empezar de cero» de la barra. Borra inscripciones, consentimientos, sorteos, ajustes y actividad. No se vuelven a cargar solas.
- **Reinicio a mano:** en el navegador, `F12` → Aplicación (Application) → Almacenamiento local → borrar las claves que empiezan por `concurso.`; o en la consola, `localStorage.clear()` y recargar la página.
- **Probar el sorteo con esos datos:** en **Ajustes** pon una fecha de cierre pasada (por ejemplo, hace tres días), guarda y ve a **Sorteo**.
- **Al publicar el concurso real**, pon `demoTools: false` en `src/config.ts`: se oculta la barra y desaparece la carga automática, de modo que nadie puede borrar o sustituir datos desde el panel.

## Cómo funciona

### Landing (`#/`)

Premio como protagonista (tarjeta destacada con zoom y cartelito «Cómo participar» al pasar el cursor), cuenta atrás hasta el cierre, tres pasos, fechas en hora de Tijuana y bloque de «juego limpio». Los botones se ocultan o desactivan cuando las inscripciones no están abiertas.

### Inscripción (`#/inscribir`)

Cabe en una pantalla de móvil: nombre, correo, teléfono (opcional, solo números y `+ ( ) - # *`), casilla obligatoria de bases y privacidad, y casilla **separada y opcional** de comunicaciones. Tras inscribirse se muestra el correo de confirmación simulado con su enlace.

### Confirmación (`#/confirmar?t=…`)

Confirma la participación con un enlace de un solo uso. Distingue confirmada, ya confirmada, caducada (pasado el margen tras el cierre) y enlace no válido.

### Bases (`#/bases`)

Bases legales completas y accesibles, con aviso de privacidad (derechos ARCO). **Texto provisional** (ver materiales pendientes).

### Panel de administración (`#/admin`)

- **Clave de demo: `tijuana2026`** (`adminCode` en `src/config.ts`, o variable `VITE_ADMIN_CODE`). Acceso simulado: la clave viaja en el JavaScript y no es seguridad real.
- **Resumen:** inscripciones, confirmadas, sin confirmar y sorteos hechos.
- **Participantes:** lista con estado y consentimientos; exportación a CSV (todos, confirmados, con permiso de comunicaciones); confirmación manual (queda marcada y registrada).
- **Sorteo:** habilitado al terminar el margen de confirmación; verifica la integridad del registro, muestra la huella final para publicarla junto al resultado y abre el correo al ganador ya redactado.
- **Correos:** plantillas de confirmación y de ganador/suplente, con botón de copiar.
- **Ajustes:** fecha de cierre (en hora de Tijuana), cerrar ahora y reabrir; bloqueados tras el primer sorteo.
- **Actividad:** registro de cambios de fecha, cierres, confirmaciones manuales, eliminaciones y sorteos, exportable.

Para probar el sorteo antes de la fecha real: en **Ajustes** pon un cierre pasado (por ejemplo, hace dos días) o usa «Cerrar inscripciones ahora» y espera el margen de confirmación; la pestaña Sorteo se habilitará.

### Rutas

La web usa rutas con almohadilla (`/#/admin`). Si alguien escribe `/admin`, `/bases`, `/inscribir` o `/confirmar` sin ella, `public/404.html` lo reenvía a la ruta correcta (funciona en la raíz y en la subcarpeta de GitHub Pages).

---

## Reglas del concurso

- **Un correo, una inscripción.** Mayúsculas, espacios, formas Unicode equivalentes y, en Gmail, puntos y «+etiqueta» cuentan como el mismo correo.
- **Solo participan los confirmados.** Quien no confirma dentro del plazo no entra al bombo.
- **Cierre automático real**, con comprobación al guardar y fechas con zona horaria.
- **Margen de confirmación** (`confirmGraceHours`, 24 h) tras el cierre; el sorteo se habilita cuando termina.
- **Consentimientos separados** (bases/privacidad y comunicaciones), cada uno con su fecha.
- **Sorteo demostrable.** Generador criptográfico (`crypto.getRandomValues`) con muestreo por rechazo (sin sesgo). Cada selección guarda fecha, bombo, huella del bombo, excluidos, algoritmo y resultado, y se encadena con la anterior mediante otra huella SHA-256. Repetible para suplentes. El registro no se puede borrar desde el panel.
- **Congelación.** Tras el primer sorteo no se puede eliminar inscripciones, confirmar a mano ni mover o reabrir el cierre.
- **CSV seguros.** Se neutralizan las fórmulas (`=`, `+`, `-`, `@`) y se incluyen los consentimientos con fecha y versión.
- **Sin mecánicas de redes sociales ni compra o pago**, como pide el encargo.

---

## Materiales del cliente pendientes (datos ficticios en su lugar)

El cliente todavía no ha entregado ninguno de estos materiales (en el encargo figuran como «sin enlace todavía»). Mientras tanto la web usa **datos ficticios realistas** y está pensada para sustituirlos sin tocar la lógica:

| Material del cliente | Estado | Qué hay ahora (ficticio) | Dónde se sustituye |
|---|---|---|---|
| **Bases legales del concurso** | Sin enlace todavía | Texto inventado y completo (participación, plazos, sorteo, suplentes, aviso de privacidad). Muestra un aviso de «borrador pendiente de revisión legal». | `src/components/Bases.tsx`; luego `legalDraft: false` y subir `basesVersion` en `src/config.ts` |
| **Fotografía del premio** | Sin enlace todavía | Foto de ejemplo (guitarras y amplificador en un escenario) con la nota «Foto ilustrativa». | Poner la foto en `public/` y cambiar `prizeImage` en `src/config.ts`; poner `prizeImageIsPlaceholder: false` |
| **Logotipo y marca** | Sin enlace todavía | Solo el nombre de la tienda en texto, en la cabecera, con la paleta provisional. | Cabecera en `src/App.tsx`; colores en `src/styles.css` |
| **Fechas y mecánica** | Sin enlace todavía | Apertura 15-oct-2026, cierre 30-nov-2026 23:59, sorteo 2-dic-2026 17:00 (hora de Tijuana); un ganador y suplentes; 24 h para confirmar tras el cierre. | `startDate`, `endDate`, `drawDate`, `confirmGraceHours` en `src/config.ts` |
| Nombre de la tienda, premio y su valor, correo de contacto | Sin datos | «Tu Tienda de Instrumentos», guitarra eléctrica con amplificador (~$8,000 MXN), `concurso@tutiendadeinstrumentos.mx` | `storeName`, `prize`, `prizeHeadline`, `prizeValue`, `contactEmail` en `src/config.ts` |

Todo lo ficticio está marcado como `PROVISIONAL` en `src/config.ts`. Las bases inventadas **no tienen validez legal** hasta que las revise un abogado y, si procede, se confirme si este tipo de sorteo requiere permiso ante la Secretaría de Gobernación.

### Configuración (`src/config.ts`)

- `timeZone` (`America/Tijuana`) y fechas con su desfase horario (`-07:00` hasta el 1-nov-2026, `-08:00` después). Todas las fechas se muestran y se aplican en hora de Tijuana, sin importar desde dónde entre el visitante.
- `confirmGraceHours`: horas tras el cierre en las que aún se puede confirmar el correo.
- `basesVersion`: versión de las bases; se guarda con el consentimiento de cada participante. Cámbiala cuando cambie el texto legal.
- `legalDraft`: mientras sea `true`, las bases muestran el aviso de borrador.
- `adminCode`: clave del panel. **Cámbiala antes de publicar.**
- `demoTools`: barra y carga automática de datos de ejemplo del panel. **Ponlo en `false` antes de publicar.**

---

## Plantillas de correo

Preparadas en `src/lib/emails.ts`:

- **Confirmación de inscripción** (doble validación): lleva el enlace de confirmación y el plazo.
- **Aviso a ganador o suplente**, con el plazo para responder.

En esta versión **no se envía ningún correo**: al inscribirse se ve el correo de confirmación en pantalla (con su enlace y un botón de confirmar), y la pestaña **Correos** del panel muestra ambas plantillas y permite copiarlas. El envío real se conecta usando esas mismas funciones.

---

## Cómo arrancar el proyecto

Necesitas Node.js 20.19 o superior. Desde tu ordenador, dentro de la carpeta del proyecto:

```bash
git clone https://github.com/osalgado50/concurso-instrumentos.git
cd concurso-instrumentos
npm install
npm run dev      # servidor local (muestra la dirección en la terminal)
npm test         # 35 tests de las reglas del concurso (vitest)
npm run build    # comprueba tipos y genera dist/
npm run preview  # sirve dist/ en local
```

Para ver el panel en local abre `/#/admin` con la clave de demo. Dónde está cada cosa: `src/config.ts` (datos del concurso), `src/components/` (pantallas), `src/lib/` (reglas) y `tests/`; el detalle está en «Estructura» más abajo.

### Estructura

```
src/
  config.ts            datos del concurso (lo PROVISIONAL se sustituye aquí)
  types.ts             tipos de datos
  components/          Landing, Inscribir, Confirmar, Bases, Admin
  lib/
    store.ts           inscripciones, duplicados, confirmaciones, validaciones
    draw.ts            sorteo y cadena de huellas
    state.ts           fechas: apertura, cierre, margen, sorteo habilitado
    emails.ts          plantillas de correo
    demo.ts            datos de ejemplo y reinicio (demoTools)
    csv.ts             exportaciones seguras
    storage.ts         lectura y escritura en localStorage
    time.ts, useNow.ts fechas por zona horaria y reloj reactivo
public/                404.html (reenvío de rutas), imagen de portada, favicon
tests/                 concurso, emails, teléfono y datos de ejemplo (vitest)
```

Los datos viven en el `localStorage` del navegador (claves `concurso.*.v2`).

### Despliegue

- **Vercel:** proyecto `concurso-instrumentos`, conectado al repositorio. Si un push a `main` no se despliega solo, se lanza un despliegue de producción desde el panel de Vercel.
- **GitHub Pages:** publica la rama `gh-pages`, que contiene la compilación (`dist/`). No se actualiza sola: tras `npm run build`, se sustituye el contenido de `gh-pages` por el de `dist/` (con un archivo `.nojekyll`) y se hace push.

---

## Limitaciones y siguiente paso

Esta versión sigue el stack del encargo y es una demostración funcional. Para uso real hace falta, en el pulido final:

- **Backend** donde se guarden las inscripciones: con `localStorage`, la lista de participantes reales queda en el navegador de cada visitante y no llega al panel de la tienda.
- **Envío real de correos** (confirmación y aviso al ganador) con las plantillas ya preparadas.
- **Autenticación real del panel**: la clave de demo viaja en el JavaScript.
- **Hora del servidor** para el cierre automático.
- **Publicar la huella final del sorteo** junto con el resultado: la cadena de huellas detecta alteraciones del registro, pero quien controla el navegador podría regenerarlo entero.
- **Revisión legal** de las bases y confirmación de si este tipo de sorteo requiere permiso ante la Secretaría de Gobernación.
- **Materiales reales del cliente** (tabla anterior).
