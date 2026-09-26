# Landing page de eventos: Navbar, Footer y secciones (Fases 3 y 4)

## Metadatos
- Fecha: 2026-09-25
- Módulo de dominio: landing (secciones de la página) + `components/layout` (Navbar y Footer compartidos). Consume `events` solo por su API pública.
- Requerimiento: "Construir la UI de la landing de la Ticketera con mock data, usando en su mayoría componentes shadcn, solo modo claro, Poppins, referencia Ticketmaster y Joinnus." Continúa las Fases 1 y 2 (`2026-09-25-design-system-foundation.md`, `2026-09-25-events-module-card.md`), ya implementadas. Esta spec agrupa las Fases 3 y 4 para poder construir en paralelo.

## Objetivo
Al terminar, `/` muestra la landing completa: Navbar sticky, hero con carrusel de eventos destacados, buscador, categorías, eventos destacados, próximos eventos, eventos en Lima, banner "Publica tu evento", newsletter y Footer. Todo sigue `docs/DESIGN.md` y usa los eventos mock. Navbar y Footer quedan en `layout.tsx` para reutilizarse en las demás pages.

## Excepción declarada al presupuesto de sesión
Esta spec supera los límites de `sdd-spec` (1 módulo, 6 archivos, 3 sub-tareas, 4 AC): toca 2 áreas, unos 17 archivos, 4 sub-tareas paralelas y 6 AC. Se acepta porque el trabajo es casi todo presentacional, las sub-tareas tienen ownership disjunto y así lo pidió la persona (construir rápido con agentes en paralelo). Requiere aprobación explícita de esa excepción junto con la de la spec.

## Fuera de alcance
- Páginas destino (`/events`, `/events/[slug]`, `/login`): los enlaces existen pero devuelven 404 hasta sus propias specs.
- Filtrado real en el buscador y en las categorías (el buscador envía un formulario GET a `/events`).
- Autenticación, carrito, service HTTP, TanStack Query y stores.
- Envío real del newsletter (solo estado local y mensaje de confirmación).
- Modo oscuro, Swiper u otra librería nueva.

## Inventario de reutilización
| Pieza | Búsqueda hecha | ¿Existe? | Decisión |
|---|---|---|---|
| `Button`, `Card`, `Badge` | `ls src/components/ui/` | Sí, en el proyecto | Reusar |
| `Sheet`, `Input`, `Select`, `Carousel`, `Separator` | `ls src/components/ui/` | No en el proyecto; sí en shadcn | `npx shadcn@latest add sheet input select carousel separator` |
| `navigation-menu`, `dropdown-menu`, `skeleton` | DESIGN.md §5 | Existen en shadcn | No se instalan: los enlaces de categorías son `Link` y no hay estado de carga con datos mock (YAGNI) |
| `EventCard`, `EVENTS`, `EVENT_CATEGORIES`, `Event` | `grep -r "EventCard" src/` | Sí, módulo `events` | Reusar por `@/modules/events` |
| Etiquetas de categoría en español | `grep -rn CATEGORY_LABELS src/` | Solo local en `EventCard.tsx` | Mover a `EVENT_CATEGORY_LABELS` en `events.schema.ts` y exportar (DRY: lo usan `EventCard`, Navbar, Footer y `CategoryList`) |
| Filtros de eventos (destacados, próximos, por ciudad) | `grep -rniE "featured|upcoming" src/` | No | Crear `events.selectors.ts` en el módulo `events` |
| Iconos | `lucide-react` en `package.json` | Sí | Reusar; no instalar otra |
| Carrusel | `Carousel` de shadcn (Embla) | Existe en shadcn | Reusar; no instalar Swiper |
| Navbar, Footer, secciones de landing | `ls src/components/layout src/modules/landing` | No existen | Crear |

## Cambios por archivo

### Paso previo en serie (antes del paralelo)
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/components/ui/{sheet,input,select,carousel,separator}.tsx` | crear (shadcn) | Código generado, sin modificar |
| `src/modules/events/schemas/events.schema.ts` | editar | Exportar `EVENT_CATEGORY_LABELS: Record<EventCategory, string>` |
| `src/modules/events/components/EventCard.tsx` | editar | Usar `EVENT_CATEGORY_LABELS` en vez de la constante local |
| `src/modules/events/utils/events.selectors.ts` | crear | `getFeaturedEvents(events)`, `getUpcomingEvents(events, now, limit)` (ordenados por `startsAt`, sin pasados) y `getEventsByCity(events, city, limit)` |
| `src/modules/events/utils/events.selectors.test.ts` | crear | Tests de los tres selectores |
| `src/modules/events/index.ts` | editar | Exportar `EVENT_CATEGORY_LABELS` y los selectores |

### Sub-tarea A: chrome compartido
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/components/layout/Navbar.tsx` | crear | Cliente. `h-16` sticky, blanco con `border-b`; logo "Ticketera" (icono `Ticket`), enlaces a `/events?category={slug}` para las 6 categorías, `Input` de búsqueda (solo escritorio), botón "Ingresar" y `Sheet` con el menú en móvil |
| `src/components/layout/Footer.tsx` | crear | Fondo `bg-foreground text-background`; columnas de enlaces (categorías, empresa, ayuda), redes con iconos lucide, medios de pago como texto en `Badge` outline y línea de derechos |
| `src/components/layout/layout.constants.ts` | crear | `COMPANY_LINKS`, `HELP_LINKS` y `PAYMENT_METHODS` (constantes `UPPER_SNAKE_CASE`) |

### Sub-tarea B: hero y buscador
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/landing/components/HeroSection.tsx` | crear | `Carousel` con los eventos destacados (imagen `aspect-[16/9] md:aspect-[21/9]`, degradado inferior, título Display, fecha, CTA coral a `/events/{slug}`); `priority` solo en la primera imagen; sin autoplay |
| `src/modules/landing/components/EventSearchBar.tsx` | crear | Cliente. `<form action="/events" method="get">` con `Input` (evento o artista), `Select` de ciudad y fecha, y botón de búsqueda; `h-11` |

### Sub-tarea C: categorías y listados
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/landing/components/CategoryList.tsx` | crear | Chips o tarjetas con icono lucide y `EVENT_CATEGORY_LABELS`, enlazadas a `/events?category={slug}` |
| `src/modules/landing/components/EventGridSection.tsx` | crear | Sección con H2, enlace "Ver todos" y grilla `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` de `EventCard`; props `title`, `events`, `href` |
| `src/modules/landing/components/EventCarouselSection.tsx` | crear | Misma cabecera y un `Carousel` horizontal de `EventCard`; mismas props |

### Sub-tarea D: CTA y newsletter
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/landing/components/CtaBanner.tsx` | crear | Banner "Publica tu evento" con fondo `bg-primary`, texto claro y botón; solo tokens |
| `src/modules/landing/components/NewsletterSection.tsx` | crear | Cliente. `Input` de correo y botón; valida con zod (`z.email()`); muestra error si es inválido y mensaje de confirmación si es válido; sin llamada de red |
| `src/modules/landing/components/NewsletterSection.test.tsx` | crear | Tests de comportamiento (ver plan de tests) |

### Paso posterior en serie (después del paralelo)
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/landing/index.ts` | crear | Exporta las secciones (API pública del módulo) |
| `src/app/layout.tsx` | editar | Montar `Navbar` y `Footer` alrededor de `children` |
| `src/app/page.tsx` | editar | Compone en orden: `HeroSection`, `EventSearchBar`, `CategoryList`, `EventGridSection` (destacados), `EventCarouselSection` (próximos), `EventGridSection` (Lima), `CtaBanner`, `NewsletterSection`. Sin lógica: los datos salen de los selectores |

## Paso previo en serie
Ejecutar en este orden, una sola persona/agente, antes de lanzar A a D:
1. `npx shadcn@latest add sheet input select carousel separator` (verificar que ningún archivo generado importe de una ruta inexistente).
2. Cambios en el módulo `events` de la tabla "Paso previo en serie": primero el test rojo de `events.selectors.test.ts`, luego `events.selectors.ts`, luego `EVENT_CATEGORY_LABELS` y los exports.
3. `npm test`, `npx tsc --noEmit` y `npm run lint` en verde antes de paralelizar.

## Sub-tareas paralelizables
Solo se lanzan tras el paso previo. Ninguna toca rutas compartidas (`src/components/ui`, `src/lib`, `src/providers`, `src/app/layout.tsx`, `package.json`). Ownership exclusivo y disjunto; ninguna ruta contiene a otra.

| # | Alcance | Rutas (ownership exclusivo) | AC que cubre |
|---|---|---|---|
| A | Navbar y Footer | `src/components/layout/**` | AC-2 |
| B | Hero y buscador | `src/modules/landing/components/HeroSection.tsx`, `src/modules/landing/components/EventSearchBar.tsx` | AC-3 |
| C | Categorías y listados | `src/modules/landing/components/CategoryList.tsx`, `src/modules/landing/components/EventGridSection.tsx`, `src/modules/landing/components/EventCarouselSection.tsx` | AC-3 |
| D | CTA y newsletter | `src/modules/landing/components/CtaBanner.tsx`, `src/modules/landing/components/NewsletterSection.tsx`, `src/modules/landing/components/NewsletterSection.test.tsx` | AC-3, AC-4 |

Reglas para los cuatro:
- Importar del módulo `events` solo desde `@/modules/events`; ninguna sub-tarea edita `src/modules/events/**`.
- No importar entre sub-tareas: `landing/index.ts` (paso posterior) es lo único que las une.
- Si falta algo en una ruta que no es suya, se detiene y lo reporta; no lo improvisa.

## Criterios de aceptación
- **AC-1**: `getFeaturedEvents` devuelve solo los eventos con `featured: true`; `getUpcomingEvents(events, now, limit)` excluye los eventos con `startsAt` anterior a `now`, los ordena ascendente y respeta `limit`; `getEventsByCity` filtra por ciudad sin distinguir mayúsculas y respeta `limit`.
- **AC-2**: `Navbar` es sticky, muestra enlaces a las 6 categorías con `EVENT_CATEGORY_LABELS` y en móvil abre un `Sheet` con el menú; `Footer` se ve con fondo `bg-foreground`; ambos están montados en `layout.tsx` y `page.tsx` no los importa.
- **AC-3**: `/` renderiza en este orden hero, buscador, categorías, destacados, próximos, eventos en Lima, banner y newsletter; todos los eventos se muestran con `EventCard`; los carruseles usan `Carousel` de shadcn; el código no contiene colores hex ni `dark:` propios (solo tokens de `DESIGN.md`); no se añadió ninguna dependencia a `package.json`.
- **AC-4**: `NewsletterSection` con un correo inválido muestra un mensaje de error y no confirma; con un correo válido muestra la confirmación y limpia el campo.
- **AC-5**: `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build` terminan sin errores, y ningún archivo de `landing` ni de `components/layout` importa una ruta interna de `events` (solo `@/modules/events`).
- **AC-6**: `src/app/page.tsx` y `layout.tsx` solo componen (sin lógica de negocio, sin filtrado propio), conforme a `docs/SETUP.md` §1.1 regla 4.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `events.selectors.ts` | `test-first` | AC-1; el Developer reporta la salida en rojo como evidencia |
| `NewsletterSection.tsx` | `test-after` | AC-4: error con correo inválido, confirmación con uno válido, campo limpio tras confirmar |
| `Navbar.tsx` | sin test | Presentacional con estado de `Sheet` que gestiona shadcn |
| `Footer.tsx`, `HeroSection.tsx`, `EventSearchBar.tsx` (formulario GET sin lógica), `CategoryList.tsx`, `EventGridSection.tsx`, `EventCarouselSection.tsx`, `CtaBanner.tsx`, `landing/index.ts` | sin test | Presentacionales o barrels |
| `page.tsx`, `layout.tsx`, archivos de shadcn | sin test | Solo componen o son código generado |

## Verificación
```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```
Además, el Reviewer levanta `npm run dev` y comprueba `/` en 375 px y 1280 px: sin scroll horizontal, grilla de 1 a 4 columnas y menú móvil funcional.

## Fases siguientes
- **Fase 5**: página de listado `/events` con filtros por categoría, ciudad y fecha (usa los enlaces de esta spec).
- **Fase 6**: página de detalle `/events/[slug]` con selección de entradas.
