# Módulo tickets: selección de entradas con mapa de asientos (Fase 1 de las features)

## Metadatos
- Fecha: 2026-09-29
- Módulo de dominio: tickets (consume la API pública de `events`)
- Requerimiento: "Continuar con el desarrollo de las interfaces del proyecto ticketera (features, mobile y desktop) según el diseño de Claude Design. Buscar la mejor librería compatible para dibujar un mapa de asientos seleccionable e iniciar el desarrollo. Alcance solo UI/UX, con datos de prueba." Esta fase entrega la pantalla **4 · Selección de entradas** (escritorio y móvil) con mapa de asientos, que es la pieza con más riesgo técnico del flujo de compra.

## Objetivo
Al terminar existe la ruta `/events/[slug]/tickets` que muestra el evento, un **mapa del recinto por zonas** y, al tocar una zona numerada, un **mapa de asientos** con zoom y arrastre donde se eligen butacas concretas. Las zonas de campo (sin numerar) se compran por cantidad. Un resumen muestra las líneas, el total y el botón "Continuar". Funciona en escritorio (mapa + resumen lateral) y en móvil (mapa a ancho completo + barra inferior fija con total y CTA), siguiendo `docs/DESIGN.md`.

## Decisión técnica: librería del mapa
| Opción | Compatibilidad con el proyecto | Veredicto |
|---|---|---|
| **SVG propio + `react-zoom-pan-pinch` 4.x** | MIT, peer `react: *` (acepta React 19.2), sin canvas, ~10 kB. Los asientos son elementos SVG: se estilizan con los tokens de Tailwind, se pueden enfocar con teclado y tener `aria-label`, y se testean con Testing Library | **Elegida** |
| `react-konva` 19.x | Pide `react ^19.3.0` (tenemos 19.2.8) → conflicto de peer. Dibuja en `<canvas>`: sin accesibilidad nativa ni tests con Testing Library, y requiere `dynamic(..., { ssr: false })` | Descartada |
| `@alisaitteke/seatmap-canvas` | Peer `react ^18` (no declara React 19), basada en D3, estilos propios que no usan nuestros tokens | Descartada |
| seats.io (`@seatsio/seatsio-react`) | Servicio de pago: requiere cuenta, claves y charts en su backend. Fuera del alcance "solo UI sin backend" | Descartada (opción a evaluar si el producto real lo necesita) |
| `react-seat-picker`, `seatchart` | Sin mantenimiento (React 15/16, última versión 2022) | Descartadas |

El mapa es **de dos niveles**, patrón de Ticketmaster/Joinnus: vista de zonas (como el diseño, "Elige tu zona") → vista de butacas de la zona elegida. La librería solo aporta zoom/arrastre/pinch; el dibujo es SVG propio generado desde los datos mock.

## Fuera de alcance
- Pantallas 2, 3, 5–8 del diseño (búsqueda, detalle, checkout, confirmación, cuenta, organizador): ver "Fases siguientes".
- Persistir la selección entre páginas (zustand) y la ruta de checkout: "Continuar" enlaza a `/events/[slug]/checkout`, que se construye en la Fase 3.
- Reserva con temporizador, backend, disponibilidad en tiempo real.
- Mapas distintos por recinto: un único recinto mock (estadio) para todos los eventos.
- Cambios en `Navbar`, `SearchTopbar` o `layout.tsx` (el header de pasos del diseño se resuelve dentro de la página, ver `TicketSelection`).

## Inventario de reutilización
| Pieza | Búsqueda hecha | ¿Existe? | Decisión |
|---|---|---|---|
| Evento por slug | `grep -rn "slug" src/modules/events` | Hay `EVENTS` y `Event`; no hay selector por slug | Buscar con `EVENTS.find` en la página (una línea, KISS); si otro módulo lo necesita en la Fase 2 se extrae a `events.selectors.ts` |
| `formatPrice`, `formatEventDate` | `src/modules/events/utils/events.utils.ts` | Sí | Reusar desde `@/modules/events` |
| `Button`, `Badge`, `Card`, `Separator` | `ls src/components/ui` | Sí | Reusar |
| Stepper de cantidad (− n +) | `grep -rni "stepper\|quantity" src/` y registro shadcn | No existe en el proyecto ni en shadcn | Crear dentro de `TicketSelection` (un solo uso; se extrae a `components/ui` cuando haya un segundo uso) |
| Zoom/pan del mapa | `package.json` | No | `npm install react-zoom-pan-pinch` (paso previo) |
| Tipos de zona/asiento | `grep -rni "seat\|zone" src/` | No | Crear schema zod en el módulo |
| Lógica de selección | `grep -rni "reducer\|selection" src/` | No | Crear reducer puro en `utils` (sin zustand: el estado vive en una sola pantalla, YAGNI) |

## Cambios por archivo
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/tickets/schemas/seating.schema.ts` | crear | `zoneSchema` (id, name, price, kind `seated` \| `general`, status `available` \| `low-stock` \| `sold-out`, forma SVG de la zona en el plano: `x, y, width, height`), `seatSchema` (id, zoneId, row letra, number, x, y, status `available` \| `occupied`), `venueMapSchema` (name, viewBox, stage, zones, seats) y tipos inferidos. `MAX_TICKETS_PER_ORDER = 6` |
| `src/modules/tickets/data/seating.mock.ts` | crear | `VENUE_MAP` validado con `venueMapSchema.parse`: Estadio Nacional con escenario, Campo VIP (general, agotado), Campo General (general), Tribuna Occidente (numerada, últimas entradas), Tribuna Oriente (numerada) y Tribuna Norte (numerada). Asientos generados con una función determinista (filas A–L, ~20 butacas por fila, curvatura leve) y ~25 % ocupados con patrón fijo, sin `Math.random` |
| `src/modules/tickets/utils/seatSelection.ts` | crear | `seatSelectionReducer` y estado inicial: acciones `toggleSeat`, `setGeneralQuantity`, `clear`; ignora asientos ocupados y zonas agotadas; nunca supera `MAX_TICKETS_PER_ORDER` sumando butacas + cantidades de campo. Selector `getSelectionSummary(state, venue)` → líneas `{ zoneName, detail, quantity, amount }`, `count` y `total` |
| `src/modules/tickets/utils/seatSelection.test.ts` | crear | Tests del reducer y del resumen (ver plan) |
| `src/modules/tickets/components/SeatMap.tsx` | crear | `"use client"`. Recibe `zone`, `seats`, `selectedSeatIds`, `onToggleSeat`. SVG con etiquetas de fila, butacas como `<circle>` dentro de `<g role="button" tabIndex={0} aria-pressed aria-label="Fila C, asiento 12, S/ 380.00">` (Enter/Espacio seleccionan), ocupadas con `aria-disabled`. Envuelto en `TransformWrapper` con botones Acercar / Alejar / Restablecer (`size-11`, 44 px táctiles), pinch en móvil, leyenda Disponible / Seleccionado / Ocupado. Colores: disponible `primary/35`, seleccionado `primary`, ocupado `muted` |
| `src/modules/tickets/components/TicketSelection.tsx` | crear | `"use client"`. Recibe `event: Event` y `venue`. Usa `useReducer(seatSelectionReducer)`. Compone: cabecera (volver al evento, imagen, título, fecha y lugar; indicador de pasos 1 Entradas · 2 Datos y pago · 3 Confirmación), vista de zonas en SVG (escenario + zonas clicables con nombre y precio, "Agotado" deshabilitado), al elegir zona numerada muestra `SeatMap` con "← Todas las zonas"; al elegir zona general muestra stepper de cantidad. Lista "Entradas" con precios y badges ("Últimas entradas" `warning`, "Agotado" `destructive`). Resumen: en `lg:` `aside` sticky a la derecha; en móvil barra inferior `fixed bottom-0` con total y CTA. CTA coral "Continuar" (único coral de la vista) enlaza a `/events/{slug}/checkout`, deshabilitado sin selección; texto "Máximo 6 entradas por compra" |
| `src/modules/tickets/index.ts` | crear | Exporta `TicketSelection`, `VENUE_MAP` y tipos |
| `src/app/events/[slug]/tickets/page.tsx` | crear | Server Component delgado: `const { slug } = await params`, busca el evento en `EVENTS`, `notFound()` si no existe, renderiza `<TicketSelection event={event} venue={VENUE_MAP} />`. `generateStaticParams` con los slugs de `EVENTS` |

> **Desvío del presupuesto de sesión:** son 8 archivos (límite 6). Partirlo dejaría una fase sin nada visible en el navegador. Si prefieres respetar el límite, la alternativa es Fase 1a (schema, mock, reducer + test, index) y Fase 1b (componentes + página).

## Paso previo en serie
`npm install react-zoom-pan-pinch` (toca `package.json` y `package-lock.json`, rutas compartidas). Antes de usarla, confirmar en `node_modules/next/dist/docs/01-app` la firma de `params` (Promise) y `generateStaticParams` en Next 16.

## Sub-tareas paralelizables
Sub-tarea única, sin paralelismo: `SeatMap` y `TicketSelection` dependen del schema, del mock y del reducer.

## Criterios de aceptación
- **AC-1**: `VENUE_MAP` pasa `venueMapSchema`, tiene 5 zonas (2 generales, 3 numeradas), cada zona numerada tiene al menos 150 butacas con al menos una ocupada, y todos los ids de asiento son únicos.
- **AC-2**: el reducer selecciona y deselecciona butacas disponibles, ignora butacas ocupadas y zonas agotadas, y no permite superar 6 entradas sumando butacas y cantidades de campo; `getSelectionSummary` devuelve líneas, cantidad y total correctos (p. ej. 2 × Campo General + Fila C‑12 de Occidente = S/ 1,280.00 con los precios mock 450 y 380).
- **AC-3**: en `/events/{slug}/tickets`, tocar una tribuna abre su mapa de butacas; hacer clic o pulsar Enter en una butaca disponible la marca (`aria-pressed="true"`) y actualiza el resumen; una butaca ocupada no reacciona; con 6 entradas el resto de butacas disponibles no se pueden agregar. Un slug inexistente responde 404.
- **AC-4**: a 390 px de ancho no hay scroll horizontal de página, el mapa admite pinch/zoom con botones de 44 px y el total + "Continuar" quedan visibles en la barra inferior; en ≥ 1024 px el resumen está a la derecha. `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build` terminan sin errores.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `seatSelection.ts` | `test-first` | Toggle, asiento ocupado, zona agotada, tope de 6 mezclando butacas y campo, `setGeneralQuantity` a 0 elimina la línea, resumen y total (AC-2) |
| `seating.mock.ts` | en `seatSelection.test.ts` | Validación del mock, conteos por zona y unicidad de ids (AC-1) |
| `SeatMap.tsx` | sin test propio en esta fase | La interacción la verifica el Reviewer contra AC-3 en el navegador; se agrega `SeatMap.test.tsx` si el Reviewer lo marca |
| `TicketSelection.tsx`, `page.tsx` | sin test | Composición; su lógica vive en el reducer |

## Verificación
```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
npm run dev   # revisar /events/noches-de-verano-en-vivo/tickets a 390 px y 1440 px
```

## Fases siguientes
- **Fase 2 — Búsqueda y detalle**: `/events` con filtros (categoría, ciudad, fecha, precio) y orden, y `/events/[slug]` con info, lugar, tipos de entrada y relacionados.
- **Fase 3 — Checkout y confirmación**: store zustand de la orden, `/events/[slug]/checkout` (datos del comprador con zod, tarjeta/Yape/PagoEfectivo, temporizador mock) y confirmación con QR.
- **Fase 4 — Cuenta**: login/registro y "Mis entradas" (próximas/pasadas, QR por entrada).
- **Fase 5 — Organizador**: panel con KPIs y tabla (TanStack Table) y formulario "Crear evento" con tipos de entrada y vista previa.
