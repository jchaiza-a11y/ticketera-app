# Módulo events: datos mock y EventCard (Fase 2 de la landing)

## Metadatos
- Fecha: 2026-09-25
- Módulo de dominio: events
- Requerimiento: "Construir la UI de la landing de la Ticketera con mock data para los eventos, usando en su mayoría componentes shadcn." Esta fase entrega los datos y la tarjeta de evento que reutilizan todas las secciones.

## Objetivo
Al terminar existe el módulo `events` con el schema zod de un evento, un conjunto de eventos mock validados con ese schema (imágenes de Unsplash), utilidades para formatear precio y fecha, y un `EventCard` que sigue `docs/DESIGN.md`. El módulo expone todo por `src/modules/events/index.ts`.

## Fuera de alcance
- Secciones de la landing, carruseles, hero, buscador y categorías (Fases 3 y 4).
- Navbar y Footer.
- Página de detalle de evento, service HTTP, TanStack Query y stores: los datos son mock estáticos.
- Filtrado o búsqueda de eventos.

## Inventario de reutilización
| Pieza | Búsqueda hecha | ¿Existe? | Decisión |
|---|---|---|---|
| `Card` | `ls src/components/ui/` (solo `button.tsx`) | No en el proyecto; sí en shadcn | `npx shadcn@latest add card` |
| `Badge` | `ls src/components/ui/` | No en el proyecto; sí en shadcn | `npx shadcn@latest add badge` |
| `Button` | `ls src/components/ui/` | Sí, en el proyecto | Reusar |
| Iconos (`CalendarDays`, `MapPin`) | `lucide-react` en `package.json` | Sí | Reusar |
| `cn()` | `src/lib/utils.ts` | Sí | Reusar |
| Formateo de fecha y precio | `grep -rniE "format(Date|Price|Currency)" src/` | No | Crear en el módulo (solo `events` lo usa) |
| Tipo `Event` y schema | `grep -ri "event" src/` | No | Crear con zod; el tipo se infiere con `z.infer` |
| Mock data de eventos | `grep -ri "mock" src/` | No | Crear en el módulo |

## Cambios por archivo
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/events/schemas/events.schema.ts` | crear | `EVENT_CATEGORIES` (concert, sports, theater, festival, family, conference), `eventSchema` (id, slug, title, category, imageUrl, startsAt ISO, venue, city, minPrice número, currency, badge opcional `low-stock` o `sold-out`, featured booleano) y `type Event` |
| `src/modules/events/data/events.mock.ts` | crear | `EVENTS`: al menos 12 eventos, todos con imagen `images.unsplash.com`, repartidos entre las 6 categorías y con al menos 4 destacados; se valida con `eventSchema.array().parse` al cargar el módulo |
| `src/modules/events/utils/events.utils.ts` | crear | `formatEventDate(iso)` y `formatPrice(amount, currency)` en locale `es-PE`, con zona horaria fija para resultados deterministas |
| `src/modules/events/utils/events.utils.test.ts` | crear | Tests de las dos funciones |
| `src/modules/events/components/EventCard.tsx` | crear | Tarjeta según DESIGN.md §6: `Card` con imagen `next/image` `aspect-[4/3]`, `Badge` de categoría, badge de estado si aplica, fecha, título con `line-clamp-2`, lugar y ciudad, "Desde S/ xx" en `text-brand-accent`. Recibe `event: Event` y `className` opcional; el enlace apunta a `/events/{slug}` |
| `src/modules/events/index.ts` | crear | Exporta `EventCard`, `EVENTS`, `EVENT_CATEGORIES`, `eventSchema` y `type Event` |

## Paso previo en serie
`npx shadcn@latest add card badge` genera `src/components/ui/card.tsx` y `src/components/ui/badge.tsx` (ruta compartida). Se ejecuta antes que la sub-tarea del módulo y no se modifica su código generado.

## Sub-tareas paralelizables
Sub-tarea única, sin paralelismo: un solo módulo, y `EventCard`, el mock y las utilidades dependen del mismo tipo `Event`.

## Criterios de aceptación
- **AC-1**: `eventSchema` rechaza un evento sin `title`, con categoría fuera de `EVENT_CATEGORIES` o con `minPrice` negativo, y `EVENTS` pasa la validación con al menos 12 eventos, las 6 categorías representadas y todas las imágenes de `images.unsplash.com`.
- **AC-2**: `formatPrice(120, "PEN")` devuelve `S/ 120.00` y `formatEventDate` devuelve la fecha en español (por ejemplo `sáb 15 nov`) para un ISO dado, con resultado idéntico sin importar la zona horaria de la máquina.
- **AC-3**: `EventCard` renderiza título, lugar, ciudad, fecha y precio formateados con las utilidades, muestra el badge "Agotado" cuando `badge` es `sold-out` y "Últimas entradas" cuando es `low-stock`, y enlaza a `/events/{slug}`.
- **AC-4**: `src/modules/events/index.ts` es el único punto de importación del módulo y no importa nada de otro módulo; `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build` terminan sin errores.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `events.utils.ts` | `test-first` | Formato de precio y fecha, incluida una fecha en el límite de zona horaria; el Developer reporta la salida en rojo como evidencia |
| `events.schema.ts` | sin test propio | Se ejercita al parsear `EVENTS` al cargar el módulo (AC-1) |
| `EventCard.tsx` | sin test | Presentacional; su comportamiento condicional (badges) lo revisa el Reviewer contra AC-3 |
| `card.tsx`, `badge.tsx` | sin test | Código generado de shadcn sin modificar |

## Verificación
```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Fases siguientes
- **Fase 3**: `Navbar` y `Footer` compartidos (`sheet`, `input`, `navigation-menu`, `dropdown-menu`).
- **Fase 4**: secciones de la landing (hero, búsqueda, categorías, destacados, próximos, CTA, newsletter) y composición en `src/app/page.tsx`, con `carousel`, `select` y `skeleton`.
