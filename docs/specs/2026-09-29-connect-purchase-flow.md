# Conectar el flujo de compra: detalle de evento y datos por evento (Fase 2d)

## Metadatos
- Fecha: 2026-09-29
- Módulos de dominio: events (pantalla de detalle y datos derivados) y tickets (recinto por evento)
- Requerimiento: "Conectar la data con las interfaces actuales para poder comprobar el flujo completo de la aplicación."

## Diagnóstico
Inventario de enlaces (`grep` de `href`, `router.push` y `action` en `src/`) y rutas existentes:

| Corte | Dónde | Efecto |
|---|---|---|
| `/events/[slug]` no existe | `EventCard` (landing, búsqueda), `HeroSection`, "Volver al evento" de `TicketSelection` | 404: desde la landing o la búsqueda **no se puede llegar** a comprar |
| Recinto único con precios fijos | `VENUE_MAP` (zonas de S/ 250 a S/ 690) para los 19 eventos | Un taller "desde S/ 20" se vende a S/ 250; el precio "Desde" de la tarjeta no coincide con la pantalla de entradas |
| Evento agotado comprable | `badge: "sold-out"` no llega a las zonas | Se pueden comprar entradas de "Comedia en Tres Actos", que figura como Agotado |

Fuera del camino de compra (no se tocan): `/login`, `/my-tickets`, `/events/new`, páginas del footer.

## Objetivo
Recorrido completo sin 404 ni datos incoherentes: **landing o búsqueda → detalle del evento → entradas → pago → confirmación**, donde el detalle y las entradas muestran precios derivados del `minPrice` de cada evento y los eventos agotados no se pueden comprar.

## Fuera de alcance
- Recintos distintos por tipo de evento (teatro, auditorio): se mantiene el estadio mock para todos; cambian nombre, precios y disponibilidad.
- Mapa real del lugar y "Cómo llegar" funcional: el bloque "Lugar" muestra nombre y ciudad, y "Cómo llegar" abre una búsqueda en Google Maps.
- Guardar y compartir evento (botones del hero del diseño).
- Restaurar la selección al volver de "Cambiar entradas".
- Login, Mis entradas y organizador (Fases 4 y 5).

## Inventario de reutilización
| Pieza | Búsqueda hecha | ¿Existe? | Decisión |
|---|---|---|---|
| Datos del evento | `EVENTS`, `eventSchema` | Sí | Reusar sin cambiar el schema: hora, apertura de puertas, edad y descripción se **derivan** (no se agregan 19 campos mock nuevos) |
| Formato de fecha | `formatEventDate` en `events.utils.ts` | Sí (fecha corta) | Agregar `formatEventTime` y `formatEventLongDate` en el mismo archivo |
| Tarjeta para relacionados | `EventCard` | Sí | Reusar |
| Zonas y precios | `VENUE_MAP`, `Zone` en `tickets` | Sí | Nueva función pura `getVenueMapForEvent(event)` que ajusta el mapa base |
| Badges de estado | `STATUS_BADGES` en `EventCard` y `TicketSelection` | Sí | Reusar estilos (`bg-warning`, `bg-destructive`) |
| Botón CTA | variante `cta` de `button.tsx` | Sí | Reusar |

## Cambios por archivo
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/tickets/utils/venueForEvent.ts` | crear | `getVenueMapForEvent(event, base = VENUE_MAP)`: nombre del recinto = `event.venue`; precios escalados para que la zona más barata sea exactamente `event.minPrice` y el resto mantenga la proporción del mapa base, redondeados a múltiplos de 5; si el evento es `sold-out`, todas las zonas quedan `sold-out`; si es `low-stock`, se respeta el estado base. No muta el mapa base |
| `src/modules/tickets/utils/venueForEvent.test.ts` | crear | Tests |
| `src/modules/tickets/index.ts` | modificar | Exporta `getVenueMapForEvent` |
| `src/app/events/[slug]/tickets/page.tsx` | modificar | Usa `getVenueMapForEvent(event)` en lugar de `VENUE_MAP` |
| `src/modules/events/utils/events.utils.ts` (+ test existente) | modificar | `formatEventTime(iso)` → `8:00 p. m.` y `formatEventLongDate(iso)` → `domingo 15 de noviembre`, en zona `America/Lima` |
| `src/modules/events/utils/events.details.ts` | crear | `getEventDetails(event)` → `{ doorsOpenAt, startsAt, minimumAge, description }` (apertura 1 h antes; edad por categoría: familia/cine/cursos "Todo público", vida nocturna "+18", el resto "+14"; descripción con plantilla por categoría usando título, lugar y ciudad). `getRelatedEvents(events, event, limit = 4)` → misma categoría primero, luego misma ciudad, sin el propio evento ni agotados |
| `src/modules/events/utils/events.details.test.ts` | crear | Tests |
| `src/modules/events/components/EventDetail.tsx` | crear | Server Component (sin estado). Recibe `event`, `tiers: { id, name, price, status }[]`, `related: Event[]` (las zonas llegan por props: `events` no importa `tickets`). Migas Inicio / Categoría / Título; hero con imagen, categoría, título, fecha larga, hora, lugar y CTA coral "Comprar entradas · desde S/ xx" → `/events/{slug}/tickets` ("Agotado" deshabilitado si `sold-out`); "Acerca del evento", "Información importante" (`dl` de 4 filas), "Lugar"; tarjeta lateral sticky "Entradas desde" con la lista de zonas y badges; en móvil, barra inferior fija con precio y CTA; "También te puede interesar" con `EventCard` |
| `src/modules/events/index.ts` | modificar | Exporta `EventDetail`, `getRelatedEvents`, formatos nuevos |
| `src/app/events/[slug]/page.tsx` | crear | Server Component delgado: busca el evento, `notFound()`, `generateStaticParams`, `generateMetadata`; compone `EventDetail` con `getVenueMapForEvent(event).zones` y `getRelatedEvents` |

> **Desvío del presupuesto de sesión:** 11 archivos en 2 módulos (límite 6 y 1). Es el mínimo para cerrar los tres cortes del diagnóstico; partirlo deja el flujo roto en alguna de las dos mitades.

## Sub-tareas paralelizables
- **A (tickets):** `venueForEvent.ts`, su test, `tickets/index.ts`, `tickets/page.tsx`.
- **B (events):** `events.utils.ts`, `events.details.ts`, sus tests, `EventDetail.tsx`, `events/index.ts`.
- **C (serie, al final):** `src/app/events/[slug]/page.tsx`, que usa A y B.

## Criterios de aceptación
- **AC-1**: `getVenueMapForEvent` da a la zona más barata exactamente `event.minPrice` (p. ej. S/ 20 para la exposición y S/ 120 para "Noches de Verano en Vivo"), mantiene el orden de precios del mapa base, marca todas las zonas agotadas para un evento `sold-out` y no modifica `VENUE_MAP`.
- **AC-2**: `getEventDetails` y `getRelatedEvents` devuelven apertura 1 h antes del inicio en hora de Lima, la edad según la categoría, y hasta 4 relacionados que priorizan la misma categoría y excluyen al propio evento y a los agotados.
- **AC-3**: recorrido en navegador sin 404: landing → tarjeta → detalle → "Comprar entradas" → entradas (con precio mínimo igual al "Desde" de la tarjeta) → pago → confirmación; y búsqueda → tarjeta → detalle → entradas. "Volver al evento" y las migas funcionan. Un evento agotado muestra "Agotado" en el detalle y ninguna zona comprable en entradas.
- **AC-4**: a 390 px no hay scroll horizontal y la barra inferior del detalle muestra precio y CTA; `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build` sin errores.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `venueForEvent.ts` | `test-first` | AC-1 |
| `events.details.ts`, formatos nuevos | `test-first` | AC-2 y formato de hora/fecha larga en zona Lima |
| `EventDetail.tsx`, `page.tsx` | sin test propio | Presentacional/composición; el Reviewer verifica AC-3 y AC-4 recorriendo el flujo en el navegador |

## Verificación
```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
# navegador a 390 px y 1440 px: / → evento → entradas → pago → confirmación; /events → evento; evento agotado
```
