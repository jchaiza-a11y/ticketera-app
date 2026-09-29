# Ajustes de checkout y confirmación: requeridos, QR real, calendario y PDF (Fase 3b)

## Metadatos
- Fecha: 2026-09-29
- Módulo de dominio: orders
- Requerimiento:
  - Marcar con un asterisco rojo los campos requeridos de "Datos del comprador".
  - En "Compra confirmada", con más de una entrada, "Entrada 1 de x" se corta por las flechas.
  - Que "Agregar al calendario" y "Descargar PDF" funcionen.
  - Agregar el código QR.

## Diagnóstico (reproducido)
| Problema | Causa |
|---|---|
| "Entrada 2 de 4" cortado | Entre 768 y 1024 px la columna del QR mide 224 px (176 px útiles) y la fila flechas + texto necesita unos 206 px: la flecha derecha invade el relleno y queda pegada al borde |
| "Agregar al calendario" poco fiable | El `<a>` se crea fuera del DOM y la URL del blob se revoca en el mismo tick: Firefox y Safari pueden cancelar la descarga |
| "Descargar PDF" | Hoy abre `window.print()`: no descarga ningún archivo |
| QR | Es un patrón decorativo que no se puede escanear |

## Objetivo
- **Campos requeridos:** los 4 campos del comprador y los de tarjeta (cuando se elige tarjeta) muestran un `*` en `text-destructive` con `aria-hidden`; el input lleva `aria-required`. Nota bajo el título: "Los campos con * son obligatorios".
- **Navegación de entradas:** fila propia de ancho completo bajo el QR, con las flechas a los extremos y el texto centrado sin cortes en cualquier ancho. La columna del QR pasa a `md:w-64`.
- **QR real y escaneable** por entrada, generado con `qrcode`. Contenido: `TICKETERA|{orderId}|{n}/{N}|{eventSlug}|{zona}|{detalle}`, por ejemplo `TICKETERA|TK-24817|2/4|noches-de-verano-en-vivo|Tribuna Occidente|Fila C · 12`. Se dibuja como SVG a partir de la matriz de módulos: síncrono y sin `dangerouslySetInnerHTML`.
- **"Agregar al calendario"** es un `<a href="data:text/calendar…" download>` real: funciona en Chrome, Firefox y Safari, y en iOS abre la app Calendario. Al lado, un enlace "Google Calendar" que abre el evento prellenado en una pestaña nueva.
- **"Descargar PDF"** genera y descarga un PDF real con `jspdf`, una página por entrada: marca Ticketera, evento, fecha y hora, lugar, zona y asiento, "Entrada n de N", pedido, titular y QR vectorial grande. Nombre del archivo: `entradas-{orderId}.pdf`. La librería se carga con `import()` dinámico al hacer clic, para no engordar la página.

## Fuera de alcance
- Validación del QR en puerta y firma criptográfica (no hay backend).
- Imagen del evento dentro del PDF: las fotos de Unsplash requieren CORS; el PDF usa solo texto y vectores.

## Inventario de reutilización
| Pieza | Decisión |
|---|---|
| `buildIcsEvent` | Reusar; se agrega `buildIcsDataUrl` y `buildGoogleCalendarUrl` en el mismo archivo |
| `buildQrPattern` (decorativo) | Se **reemplaza** por `buildTicketQr(payload)` → `{ size, modules: boolean[] }` usando `qrcode` |
| `TextField` del checkout | Se extiende con la prop `required` (no se duplica) |
| `formatEventTime`, `formatEventLongDate` | Reusar en el PDF |
| Dependencias nuevas | `qrcode` (MIT) + `@types/qrcode`, `jspdf` (MIT); ambas se instalan desde registry.npmjs.org, que este entorno sí alcanza |

## Cambios por archivo
| Ruta | Acción | Qué contiene |
|---|---|---|
| `package.json` | modificar | `qrcode`, `jspdf`, `@types/qrcode` (paso previo) |
| `src/modules/orders/utils/ticketArtifacts.ts` (+ test) | modificar | `buildTicketPayload`, `buildTicketQr`, `buildIcsDataUrl`, `buildGoogleCalendarUrl`; se elimina el patrón decorativo |
| `src/modules/orders/utils/ticketsPdf.ts` (+ test) | crear | `buildTicketsPdf(order, event)` → documento `jsPDF` con N páginas; `downloadTicketsPdf` hace `import()` dinámico y `save()` |
| `src/modules/orders/components/OrderConfirmation.tsx` | modificar | QR real, fila de navegación, enlace `.ics` real, enlace Google Calendar, botón PDF con estado "Generando…" |
| `src/modules/orders/components/Checkout.tsx` | modificar | `*` rojo, `aria-required` y nota de obligatorios |

## Criterios de aceptación
- **AC-1**: `buildTicketQr` produce una matriz cuadrada válida (21×21 o mayor) para cada entrada; entradas distintas generan matrices distintas; el contenido incluye el pedido, n/N y la zona.
- **AC-2**:
  - `buildIcsDataUrl` empieza por `data:text/calendar;charset=utf-8,` y decodifica al `.ics` de `buildIcsEvent`.
  - `buildGoogleCalendarUrl` apunta a `calendar.google.com/calendar/render` con `action=TEMPLATE`, `text`, `dates` en UTC y `location`.
  - `buildTicketsPdf` devuelve un documento con N páginas cuyo texto incluye el número de pedido y "Entrada n de N".
- **AC-3 (navegador)**:
  - Con 4 entradas, "Entrada 2 de 4" se ve completo, sin desbordar, a 360, 390, 768, 900, 1024 y 1440 px.
  - El QR mostrado se decodifica con un lector de QR al payload esperado (verificado con `jsQR` en el script de prueba).
  - "Agregar al calendario" descarga `{slug}.ics`.
  - "Descargar PDF" descarga `entradas-{orderId}.pdf` con N páginas.
- **AC-4**:
  - Checkout: cada campo obligatorio muestra el `*` rojo y `aria-required="true"`; los de tarjeta solo cuando el método es Tarjeta.
  - `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build` terminan sin errores.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `ticketArtifacts.ts` | `test-first` | AC-1, AC-2 (calendario) |
| `ticketsPdf.ts` | `test-first` | AC-2 (PDF: páginas y textos) |
| `OrderConfirmation`, `Checkout` | navegador | AC-3, AC-4 |
