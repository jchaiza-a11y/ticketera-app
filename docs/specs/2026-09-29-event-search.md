# Módulo events: búsqueda y listado de eventos (Fase 2a de las features)

## Metadatos
- Fecha: 2026-09-29
- Módulo de dominio: events
- Requerimiento: "Continuar con las vistas del artifact de Claude Design: Búsqueda y Listado, Checkout y Pago, Confirmación de compra." Esta spec cubre la pantalla **2 · Búsqueda y listado** (escritorio y móvil). Checkout y Confirmación van en sus propias specs (`2026-09-29-checkout.md`, `2026-09-29-order-confirmation.md`).

## Objetivo
Al terminar existe la ruta `/events` que lista los eventos mock con filtros por texto, categoría, ciudad, mes y precio, chips de filtros activos, orden (fecha / precio más bajo), contador de resultados y estado vacío. Los filtros viven en la URL, así que los enlaces que ya existen funcionan: `?category=` del Navbar/Footer, `?city=` y `?featured=` de la landing, y `?q=`, `?date=`, `?price=` del `SearchTopbar`. En escritorio los filtros van en un panel lateral; en móvil, en un `Sheet` con botón "Ver N eventos".

## Fuera de alcance
- Página de detalle `/events/[slug]` (pantalla 3 del diseño): las tarjetas siguen enlazando ahí y dan 404 hasta que se construya.
- Paginación, búsqueda en servidor y debounce: son 20 eventos mock filtrados en memoria.
- Cambios en `SearchTopbar`, `Navbar` o `EventCard`.

## Inventario de reutilización
| Pieza | Búsqueda hecha | ¿Existe? | Decisión |
|---|---|---|---|
| Tarjeta de evento | `src/modules/events/components/EventCard.tsx` | Sí | Reusar tal cual (misma tarjeta que la landing). El diseño trae una variante con fecha en bloque y "Ver entradas"; no se crea una segunda tarjeta (DRY) |
| Rangos de precio | `grep -rn "PRICE_RANGES" src` | Sí, en `components/layout/layout.constants.ts` (valores `0-50`, `50-100`, …) | Reusar para que `?price=` del topbar y del panel sean el mismo valor |
| Etiquetas de categoría | `EVENT_CATEGORY_LABELS` | Sí | Reusar |
| `formatEventDate`, `formatPrice` | `events.utils.ts` | Sí | Reusar |
| `Sheet`, `Button`, `Badge`, `Input` | `ls src/components/ui` | Sí | Reusar |
| Checkbox / radio | `ls src/components/ui` y registro shadcn | No en el proyecto; sí en shadcn | `npx shadcn@latest add checkbox radio-group label` (paso previo) |
| Filtrado/orden de eventos | `grep -rni "filter\|sort" src/modules/events` | Solo `getEventsByCity` y `getUpcomingEvents` | Crear utilidades puras nuevas |

## Cambios por archivo
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/events/utils/events.filters.ts` | crear | Tipo `EventFilters` (`q`, `categories[]`, `cities[]`, `month` `YYYY-MM` \| `null`, `date` `YYYY-MM-DD` \| `null`, `price` valor de `PRICE_RANGES`, `featured`, `sort` `date` \| `price`). `parseEventFilters(searchParams)` (ignora valores inválidos, acepta `category` repetido), `toSearchParams(filters)`, `filterEvents(events, filters)` (texto sin tildes ni mayúsculas sobre título, lugar y ciudad; mes/día en zona `America/Lima`), `sortEvents`, `getFacetCounts(events)` (conteo por categoría y ciudad), `getActiveFilterChips(filters)` → `{ key, label }[]` |
| `src/modules/events/utils/events.filters.test.ts` | crear | Tests (ver plan) |
| `src/modules/events/components/EventFiltersPanel.tsx` | crear | `"use client"`. Fieldsets Categoría (checkbox + conteo), Ciudad (checkbox + conteo), Fecha (radio: Cualquier fecha + meses con eventos), Precio (radio con `PRICE_RANGES`). Recibe `filters`, `counts`, `onChange`. Se usa dentro del aside y dentro del `Sheet` (un componente, dos contenedores) |
| `src/modules/events/components/EventSearch.tsx` | crear | `"use client"`. Recibe `events` e `initialFilters`. Estado de filtros sincronizado con la URL vía `window.history.replaceState` (sin recargar). Compone: H1 "Explora eventos" + input de texto, aside `lg:` con `EventFiltersPanel` y "Limpiar", botón "Filtros (n)" que abre `Sheet` en móvil con pie "Ver N eventos", fila de contador `aria-live` + chips removibles + orden segmentado (`aria-pressed`), grilla `sm:grid-cols-2 xl:grid-cols-3` de `EventCard`, estado vacío con "Limpiar filtros" |
| `src/modules/events/index.ts` | modificar | Exporta `EventSearch` y `parseEventFilters` |
| `src/app/events/page.tsx` | crear | Server Component: `await searchParams`, `parseEventFilters`, `<EventSearch events={EVENTS} initialFilters={…} />`. `metadata` "Explora eventos" |

## Paso previo en serie
`npx shadcn@latest add checkbox radio-group label` (escribe en `src/components/ui`, ruta compartida). Si la spec de Checkout se ejecuta antes, este paso ya está hecho.

## Sub-tareas paralelizables
Una sola sub-tarea. Puede correr en paralelo con la spec de Checkout: rutas disjuntas (`src/modules/events/**` y `src/app/events/page.tsx` frente a `src/modules/orders/**` y `src/app/events/[slug]/**`), una vez hecho el paso previo compartido.

## Criterios de aceptación
- **AC-1**: `parseEventFilters` convierte `?q=Verano&category=concert&category=family&price=50-100&sort=price` en los filtros esperados, descarta categorías, precios y fechas inválidas, y `toSearchParams(parseEventFilters(x))` es estable (ida y vuelta).
- **AC-2**: `filterEvents` combina todos los filtros con AND entre grupos y OR dentro de categoría/ciudad; la búsqueda de texto ignora tildes y mayúsculas ("cusco" encuentra "Cusco", "clasico" encuentra "Clásico"); `sortEvents` ordena por fecha ascendente o por `minPrice` ascendente.
- **AC-3**: en `/events?category=concert` se ven solo conciertos y un chip "Conciertos"; quitar el chip, marcar filtros o cambiar el orden actualiza resultados, contador y URL sin recargar; un filtro sin resultados muestra el estado vacío y "Limpiar filtros" lo restablece. Los enlaces del Navbar y el submit del `SearchTopbar` llegan filtrados.
- **AC-4**: a 390 px no hay scroll horizontal, los filtros se abren en un `Sheet` y "Ver N eventos" lo cierra; en ≥ 1024 px el panel está a la izquierda. `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build` sin errores.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `events.filters.ts` | `test-first` | Parseo e ida y vuelta de URL, filtros combinados, texto sin tildes, mes y día en zona Lima, orden, conteos y chips (AC-1, AC-2) |
| `EventFiltersPanel.tsx`, `EventSearch.tsx` | sin test propio | La lógica está en las utilidades; la interacción la revisa el Reviewer en el navegador (AC-3, AC-4) |

## Verificación
```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
# navegador: /events, /events?category=concert, /events?q=cusco, a 390 px y 1440 px
```
