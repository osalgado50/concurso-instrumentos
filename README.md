# Gran Concurso de Instrumentos — Landing

Landing del concurso para captar contactos de la tienda de instrumentos musicales en Tijuana: formulario mínimo, confirmación de correo, control de duplicados, cierre automático de inscripciones, panel de administración con exportación y sorteo demostrable.

## Tecnologías

React 19 + Vite + TypeScript + Tailwind CSS. Los datos se guardan en el `localStorage` del navegador (sin backend).

## Desarrollo

Desde tu ordenador, dentro de la carpeta del proyecto:

```bash
npm install
npm run dev      # servidor local
npm test         # tests de las reglas del concurso (vitest)
npm run build    # comprueba tipos y genera dist/
```

## Configuración

Todo lo editable está en `src/config.ts` (lo marcado PROVISIONAL hay que sustituirlo con los datos del cliente):

- Nombre de la tienda, ciudad, premio y correo de contacto.
- `timeZone` (`America/Tijuana`) y fechas de apertura, cierre y sorteo **con su desfase horario** (`-07:00` hasta el 1-nov-2026, `-08:00` después). Todas las fechas se muestran y se aplican en hora de Tijuana, sin importar desde dónde entre el visitante.
- `confirmGraceHours`: horas tras el cierre en las que aún se puede confirmar el correo (24). El sorteo se habilita cuando termina ese margen.
- `basesVersion`: versión de las bases; se guarda con el consentimiento de cada participante. Cámbiala cuando cambie el texto legal.
- `legalDraft`: mientras sea `true`, las bases muestran un aviso de texto provisional pendiente de revisión legal.
- `adminCode`: código del panel (o variable `VITE_ADMIN_CODE`). **Cámbialo antes de publicar.**

## Materiales del cliente pendientes (datos ficticios en su lugar)

El cliente todavía no ha entregado ninguno de estos materiales (en el encargo figuran como «sin enlace todavía»). Mientras tanto la web usa **datos ficticios realistas** y está pensada para sustituirlos sin tocar la lógica:

| Material del cliente | Estado | Qué hay ahora (ficticio) | Dónde se sustituye |
|---|---|---|---|
| **Bases legales del concurso** | Sin enlace todavía | Texto inventado y completo (participación, plazos, sorteo, suplentes, aviso de privacidad). Muestra un aviso de «borrador pendiente de revisión legal». | `src/components/Bases.tsx`; luego `legalDraft: false` y subir `basesVersion` en `src/config.ts` |
| **Fotografía del premio** | Sin enlace todavía | Foto de ejemplo (guitarras y amplificador en un escenario) con la nota «Foto ilustrativa». | Poner la foto en `public/` y cambiar `prizeImage` en `src/config.ts`; poner `prizeImageIsPlaceholder: false` |
| **Logotipo** | Sin enlace todavía | Solo el nombre de la tienda en texto, en la cabecera. | Cabecera en `src/App.tsx` |
| **Fechas y mecánica** | Sin enlace todavía | Apertura 15-oct-2026, cierre 30-nov-2026 23:59, sorteo 2-dic-2026 17:00 (hora de Tijuana); un ganador y suplentes; 24 h para confirmar tras el cierre. | `startDate`, `endDate`, `drawDate`, `confirmGraceHours` en `src/config.ts` |
| Nombre de la tienda, premio y su valor, correo de contacto | Sin datos | «Tu Tienda de Instrumentos», guitarra eléctrica con amplificador (~$8,000 MXN), `concurso@tutiendadeinstrumentos.mx` | `storeName`, `prize`, `prizeHeadline`, `prizeValue`, `contactEmail` en `src/config.ts` |

Todo lo ficticio está marcado como `PROVISIONAL` en `src/config.ts`. Las bases inventadas **no tienen validez legal** hasta que las revise un abogado y, si procede, se confirme si este tipo de sorteo requiere permiso ante la Secretaría de Gobernación.

## Acceso al panel de administración (demo)

- Ruta: `#/admin`
- **Clave de demo: `tijuana2026`** (definida en `adminCode` de `src/config.ts`, o con la variable `VITE_ADMIN_CODE`).
- Es un acceso simulado, como pide el encargo: la clave viaja en el JavaScript y no es seguridad real. El backend definitivo lo conecta el equipo del cliente en el pulido final.

## Plantillas de correo

Las plantillas están preparadas en `src/lib/emails.ts`:

- **Confirmación de inscripción** (doble validación): lleva el enlace de confirmación y el plazo.
- **Aviso a ganador o suplente**, con el plazo de respuesta.

En esta versión **no se envía ningún correo**: al inscribirse la persona ve el correo de confirmación en pantalla (con su enlace y un botón de confirmar), y la pestaña **Correos** del panel muestra ambas plantillas y permite copiarlas. El envío real se conecta más adelante usando esas mismas funciones.

## Reglas del concurso

- **Un correo, una inscripción.** El correo se normaliza (Unicode NFKC, sin espacios, minúsculas) antes de comparar.
- **Solo participan los confirmados.** Quien no confirma su correo dentro del plazo no entra al bombo.
- **Cierre automático real.** La fecha se comprueba al guardar cada inscripción (no solo al pintar el formulario) y la interfaz se cierra sola al llegar la hora.
- **Consentimientos separados.** Las bases/privacidad y el permiso de comunicaciones viven en un registro aparte del participante, cada uno con su fecha y, el de bases, con la versión aceptada.
- **Sorteo demostrable.** Generador criptográfico con muestreo por rechazo (sin sesgo). Cada selección guarda fecha, ids del bombo, huella SHA-256 del bombo, excluidos, algoritmo y resultado, y se **encadena** con la anterior mediante otra huella. El panel verifica la cadena y avisa si algo se alteró. Repetible para suplentes (excluye a quien ya salió). El registro **no se puede borrar** desde el panel.
- **Congelación.** Tras el primer sorteo ya no se pueden eliminar inscripciones, confirmar a mano ni mover/reabrir el cierre.
- **Registro de actividad.** Cambios de fecha, cierres/reaperturas, confirmaciones manuales (marcadas "manual" en los datos y en el CSV), eliminaciones y sorteos quedan anotados y se exportan.
- **CSV seguros.** Se neutralizan las fórmulas (`=`, `+`, `-`, `@`) y se incluyen los consentimientos con fecha y versión.

## Panel de administración

Ruta `#/admin` (clave de demo en la sección anterior). Pestañas: Resumen, Participantes (exportar todo / confirmados / permiso de comunicaciones), Sorteo (con verificación de integridad y huella final para publicar), Correos (plantillas de confirmación y de ganador), Ajustes (fecha y cierre manual, en hora de Tijuana) y Actividad.

Para probar el sorteo antes de la fecha real: en **Ajustes** pon un cierre pasado (por ejemplo, hace dos días) o usa "Cerrar inscripciones ahora" y espera el margen de confirmación; la pestaña Sorteo se habilitará.

## Limitaciones (importantes)

Esta versión sigue el stack del encargo (React + `localStorage` + Lovable), sin backend. Es una demostración funcional; lo siguiente se resuelve al conectar el backend definitivo:

- **La confirmación por correo es simulada**: el correo se muestra en pantalla, así que en esta versión cualquiera puede "confirmar" un correo que no es suyo. Para que la doble confirmación valga hace falta un backend que envíe el correo.
- **Duplicados:** los correos con mayúsculas, espacios o, en Gmail, puntos y «+etiqueta» cuentan como el mismo; pero la comprobación es por navegador, no entre dispositivos.
- **`localStorage` guarda los datos solo en el navegador de cada visitante.** La lista de participantes reales no llega al panel de la tienda. Para producción hay que pasar a un backend (por ejemplo, Supabase + un servicio de correo).
- **El código del panel viaja en el JavaScript**: no es seguridad real hasta que haya autenticación en servidor.
- La huella encadenada permite detectar alteraciones del registro, pero quien controla el navegador podría regenerarlo entero; por eso conviene **publicar la huella final** junto con el resultado.
- Los textos legales son provisionales y deben revisarse (y confirmar si este tipo de sorteo requiere permiso ante la Secretaría de Gobernación).
