# Módulo orders: confirmación de compra (Fase 2c de las features)

## Metadatos
- Fecha: 2026-09-29
- Módulo de dominio: orders
- Requerimiento: ver `2026-09-29-event-search.md`. Esta spec cubre la pantalla **6 · Confirmación de compra** (escritorio y móvil). Depende de `2026-09-29-checkout.md` (usa `lastOrder` del store).

## Objetivo
`/events/[slug]/confirmation` muestra el último pedido: pasos (todo completado), icono de éxito, "¡Compra confirmada!", número de pedido, una entrada tipo ticket (imagen, categoría, título, fecha y lugar, zona, cantidad, total pagado y un QR por entrada con navegación "Entrada 1 de N"), acciones "Ver mis entradas", "Agregar al calendario" y "Descargar PDF", y el bloque "Qué sigue" (Revisa tu correo, Muestra tu QR, Todo en Mis entradas).

## Fuera de alcance
- Página "Mis entradas" (Fase 4): "Ver mis entradas" enlaza a `/my-tickets`, que dará 404 hasta entonces.
- QR real y escaneable: el diseño usa un patrón decorativo con forma de QR y así se mantiene (no hay código que codificar sin backend).
- Envío de correo y generación de PDF en servidor.

## Inventario de reutilización
| Pieza | Búsqueda hecha | ¿Existe? | Decisión |
|---|---|---|---|
| Pedido | `useOrderStore().lastOrder` (spec de checkout) | Sí, tras la spec 2b | Reusar |
| `PurchaseSteps`, variante `cta` | spec de checkout | Sí, tras la spec 2b | Reusar (`current={3}`) |
| `formatEventDate`, `formatPrice`, `EVENT_CATEGORY_LABELS` | `@/modules/events` | Sí | Reusar |
| Patrón QR | `grep -rni "qr" src` | No | Crear generador puro determinista (21×21, tres marcas de esquina) |
| Archivo de calendario | `grep -rni "ics\|calendar" src` | No | Crear `buildIcsEvent` puro; la descarga usa `Blob` en el cliente. Sin dependencia nueva |
| PDF | — | No | "Descargar PDF" abre `window.print()` con estilos `print:` que ocultan navbar, topbar y footer (el navegador ofrece guardar como PDF). Sin dependencia nueva |

## Cambios por archivo
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/orders/utils/ticketArtifacts.ts` | crear | `buildQrPattern(seed: string): boolean[]` (441 celdas, determinista por semilla, marcas de esquina fijas) y `buildIcsEvent({ title, startsAt, venue, city, orderId })` → texto iCalendar válido (`VCALENDAR`/`VEVENT`, `DTSTART` en UTC, duración 3 h, escapado de comas y punto y coma) |
| `src/modules/orders/utils/ticketArtifacts.test.ts` | crear | Tests de ambas funciones |
| `src/modules/orders/components/OrderConfirmation.tsx` | crear | `"use client"`. Recibe `event`. Espera `useOrderHydrated()`; si no hay `lastOrder` de este evento, estado vacío "No encontramos tu compra" con enlace a `/events`. Si hay: layout centrado `max-w-4xl`; ticket horizontal en `md:` (imagen, datos, separador punteado con muescas, QR) y vertical en móvil; QR como SVG de 21×21 `rect` con `role="img"` y `aria-label="Código QR de la entrada n de N"`; botones anterior/siguiente entre entradas cuando N > 1; zona y asientos desde las líneas del pedido; acciones y "Qué sigue" en grilla `md:grid-cols-3` |
| `src/modules/orders/index.ts` | modificar | Exporta `OrderConfirmation` |
| `src/app/events/[slug]/confirmation/page.tsx` | crear | Server Component delgado, igual patrón que checkout |
| `src/app/layout.tsx` | modificar | Clases `print:hidden` en `Navbar`, `SearchTopbar`, `Footer` y el degradado (solo clases, sin lógica) |

## Paso previo en serie
Requiere la spec de checkout terminada. `src/app/layout.tsx` es ruta compartida: se toca en este paso, sin paralelismo.

## Sub-tareas paralelizables
Una sola sub-tarea.

## Criterios de aceptación
- **AC-1**: `buildQrPattern` devuelve 441 celdas, mismo resultado para la misma semilla, distinto para semillas distintas, y las tres marcas de esquina 7×7 siempre iguales.
- **AC-2**: `buildIcsEvent` produce texto con `BEGIN:VCALENDAR`, `BEGIN:VEVENT`, `DTSTART` en UTC correcto para `2026-11-15T20:00:00-05:00` (`20261116T010000Z`), `SUMMARY`, `LOCATION` con coma escapada y líneas terminadas en `\r\n`.
- **AC-3**: tras pagar en el checkout, la confirmación muestra el mismo número de pedido, zona(s), cantidad y total; con N entradas se navega de "Entrada 1 de N" a "N de N" y el QR cambia; "Agregar al calendario" descarga un `.ics`; "Descargar PDF" abre la impresión sin navbar ni footer; entrar directo sin pedido muestra el estado vacío.
- **AC-4**: a 390 px el ticket se apila en vertical sin scroll horizontal; `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build` sin errores.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `ticketArtifacts.ts` | `test-first` | AC-1 y AC-2 |
| `OrderConfirmation.tsx` | sin test propio | Composición sobre el store y las utilidades; el Reviewer verifica AC-3 y AC-4 en el navegador |

## Verificación
```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
# navegador: flujo completo tickets → checkout → confirmation, a 390 px y 1440 px
```

## Fases siguientes
- **Fase 2d — Detalle de evento**: `/events/[slug]` (pantalla 3), para que las tarjetas y "Volver al evento" dejen de dar 404.
- **Fase 4 — Cuenta**: login/registro y "Mis entradas".
- **Fase 5 — Organizador**: panel y "Crear evento".
