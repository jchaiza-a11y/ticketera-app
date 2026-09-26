# Mejoras de UI de la landing: hero Swiper, topbar de búsqueda sticky y más categorías (Fase 5)

## Metadatos
- Fecha: 2026-09-25
- Módulo de dominio: landing + `components/layout` (con un cambio serial en `events`)
- Requerimiento: "Hero con swiper para eventos principales; tener un navbar y un topbar para búsqueda por texto, por fecha y precio; al hacer scroll el topbar debe quedar sticky; tener más categorías con iconos llamativos y dentro de un card."

## Objetivo
Al terminar, el hero es un carrusel Swiper con autoplay, indicadores y flechas; existe un topbar de búsqueda (texto, fecha y precio) que queda fijo bajo el Navbar al hacer scroll; y la sección de categorías muestra 12 categorías, cada una en un card con un icono sobre un bloque de color vivo.

## Decisiones tomadas por defecto (cámbialas antes de aprobar si no te sirven)
1. **Swiper solo en el hero.** Es la única dependencia nueva (`swiper`). "Próximos eventos" sigue con el `Carousel` de shadcn.
2. **Topbar = segunda barra sticky bajo el Navbar**, montada en `layout.tsx` para que esté en todas las pages. Navbar `sticky top-0` (h-16) y topbar `sticky top-16`.
3. **Filtros del topbar: texto, fecha y precio.** La ciudad sale del buscador para que quepa. El precio es un `Select` con rangos predefinidos (no un rango libre): Cualquier precio, Hasta S/ 50, S/ 50 a S/ 100, S/ 100 a S/ 200 y Más de S/ 200. Envía `price` en el GET.
4. **Móvil:** el topbar muestra el campo de texto y un botón "Filtros" que despliega fecha y precio dentro de la misma barra (sin `Sheet`, para no sacar los campos del formulario).
5. **6 categorías nuevas:** Comedia, Cine, Gastronomía, Vida nocturna, Exposiciones y Cursos y talleres (12 en total).
6. **Colores de categoría:** 6 tonos vivos (índigo, coral, verde, cielo, rosa, ámbar oscuro) que se reparten cíclicamente; 3 son tokens nuevos. Se documentan en `DESIGN.md`.
7. **Navbar:** pierde su input de búsqueda (queda en el topbar) y muestra solo las 6 primeras categorías; el menú móvil y el Footer las muestran todas.

## Fuera de alcance
- La página `/events` que recibe los filtros (sigue dando 404).
- Filtrado real de eventos, rango de precio libre y búsqueda por ciudad en el topbar.
- Cambiar el carrusel de "Próximos eventos".

## Inventario de reutilización
| Pieza | Búsqueda hecha | ¿Existe? | Decisión |
|---|---|---|---|
| Swiper | `grep swiper package.json` | No | `npm i swiper` (pedido explícito de la persona) |
| `Input`, `Select`, `Button`, `Card` | `ls src/components/ui/` | Sí | Reusar |
| Buscador de landing | `src/modules/landing/components/EventSearchBar.tsx` | Sí | Se reemplaza por `SearchTopbar` y se elimina |
| Buscador del Navbar | `Navbar.tsx` | Sí | Se elimina (duplica el topbar) |
| `CategoryList` | `src/modules/landing/components/CategoryList.tsx` | Sí, 6 categorías sobrias | Editar: 12 categorías, cards con icono coloreado |
| `EVENT_CATEGORIES`, `EVENT_CATEGORY_LABELS` | `events.schema.ts` | Sí | Ampliar de 6 a 12 |
| Iconos nuevos (`Laugh`, `Clapperboard`, `UtensilsCrossed`, `Martini`, `Palette`, `GraduationCap`) | `lucide-react` instalada | Por verificar | El developer confirma que existan en la versión instalada; si falta uno, usa un equivalente |
| Colores de categoría | `globals.css` | No | Añadir 3 tokens `--category-sky`, `--category-rose`, `--category-amber` |

## Cambios por archivo

### Paso previo en serie
| Ruta | Acción | Qué contiene |
|---|---|---|
| `package.json` | editar | `npm i swiper` |
| `src/modules/events/schemas/events.schema.ts` | editar | 6 categorías nuevas (`comedy`, `cinema`, `gastronomy`, `nightlife`, `exhibition`, `course`) y sus etiquetas en `EVENT_CATEGORY_LABELS` |
| `src/modules/events/data/events.mock.ts` | editar | Al menos 1 evento por categoría nueva (mín. 19 eventos), con imágenes de Unsplash cuyas URLs se verifican con 200 |
| `src/modules/events/data/events.mock.test.ts` | crear | Test: cada categoría de `EVENT_CATEGORIES` tiene al menos un evento en `EVENTS` (test-first) |
| `src/app/globals.css` | editar | Tokens `--category-sky`, `--category-rose`, `--category-amber` y sus `--color-*` en `@theme` |
| `docs/DESIGN.md` | editar | Sección de colores de categoría, topbar sticky, Swiper en el hero (§5) y autoplay con pausa y `prefers-reduced-motion` (§8) |

### Sub-tarea A: topbar y Navbar
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/components/layout/SearchTopbar.tsx` | crear | Cliente. `sticky top-16 z-30`, blanco con `border-b`; `<form action="/events" method="get" role="search">` con `Input` `q`, `Input type="date"` `date` y `Select` `price`; botón Buscar; en móvil, botón "Filtros" que despliega fecha y precio |
| `src/components/layout/SearchTopbar.test.tsx` | crear | Tests de comportamiento (ver plan de tests) |
| `src/components/layout/Navbar.tsx` | editar | Quitar el input de búsqueda; mostrar solo las 6 primeras categorías en escritorio (menú móvil con las 12) |
| `src/components/layout/layout.constants.ts` | editar | `PRICE_RANGES` y `NAV_CATEGORIES_LIMIT` |

### Sub-tarea B: hero con Swiper
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/landing/components/HeroSection.tsx` | editar | Cliente. `Swiper` con módulos Autoplay (6 s, pausa al pasar el mouse, desactivado con `prefers-reduced-motion`), Pagination clickable y Navigation; mismo contenido de slide actual (imagen, degradado, título, fecha, lugar, CTA coral); `priority` solo en la primera imagen |

### Sub-tarea C: categorías
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/landing/components/CategoryList.tsx` | editar | 12 categorías; cada una en un `Card`/enlace con bloque de icono `size-14 rounded-2xl` de color sólido (token de categoría) con icono blanco `size-7`; grilla `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`; hover con elevación |

### Paso posterior en serie
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/app/layout.tsx` | editar | Montar `SearchTopbar` justo debajo de `Navbar` |
| `src/app/page.tsx` | editar | Quitar `EventSearchBar` |
| `src/modules/landing/index.ts` | editar | Quitar el export de `EventSearchBar` |
| `src/modules/landing/components/EventSearchBar.tsx` | eliminar | Reemplazado por `SearchTopbar` |

## Paso previo en serie
Orden: `npm i swiper`; test rojo de `events.mock.test.ts`; categorías y mock; tokens y `DESIGN.md`; `npm test`, `npx tsc --noEmit` y `npm run lint` en verde antes de paralelizar.

## Sub-tareas paralelizables
Solo tras el paso previo. Ninguna toca rutas compartidas ni `src/modules/events/**`.

| # | Alcance | Rutas (ownership exclusivo) | AC que cubre |
|---|---|---|---|
| A | Topbar y Navbar | `src/components/layout/**` | AC-4, AC-5 |
| B | Hero con Swiper | `src/modules/landing/components/HeroSection.tsx` | AC-3 |
| C | Categorías | `src/modules/landing/components/CategoryList.tsx` | AC-2 |

## Criterios de aceptación
- **AC-1**: `EVENT_CATEGORIES` tiene 12 categorías, cada una con etiqueta en `EVENT_CATEGORY_LABELS`, y `EVENTS` tiene al menos un evento por categoría (test).
- **AC-2**: `CategoryList` muestra las 12 categorías, cada una dentro de un card con borde y un bloque de icono de color sólido tomado de tokens (sin hex), enlazada a `/events?category={slug}`.
- **AC-3**: `HeroSection` usa Swiper con autoplay, indicadores y flechas; el autoplay se pausa al pasar el mouse y no corre con `prefers-reduced-motion`; `swiper` es la única dependencia nueva y "Próximos eventos" sigue con el `Carousel` de shadcn.
- **AC-4**: `SearchTopbar` ofrece texto, fecha y precio (rangos predefinidos), envía un GET a `/events` con `q`, `date` y `price`, y en móvil oculta fecha y precio tras un botón "Filtros".
- **AC-5**: `Navbar` es `sticky top-0` y `SearchTopbar` es `sticky top-16`, de modo que ambos permanecen visibles al hacer scroll; el Navbar ya no tiene input de búsqueda, muestra 6 categorías en escritorio y el menú móvil lista las 12; `EventSearchBar` ya no existe ni se renderiza.
- **AC-6**: `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build` terminan sin errores; ninguna sub-tarea tocó rutas ajenas; y `DESIGN.md` documenta los tokens de categoría, el topbar y el uso de Swiper.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `events.mock.ts` | `test-first` | Cada categoría tiene al menos un evento; el Developer reporta el rojo |
| `SearchTopbar.tsx` | `test-after` | En móvil "Filtros" muestra y oculta fecha y precio; los campos tienen los `name` `q`, `date` y `price` |
| `HeroSection.tsx`, `CategoryList.tsx`, `Navbar.tsx`, `layout.constants.ts` | sin test | Presentacionales o configuración |
| `layout.tsx`, `page.tsx`, `globals.css`, `landing/index.ts` | sin test | Solo componen o son estilos |

## Verificación
```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```
Revisión visual a 375 px y 1280 px por la persona con `npm run dev`: topbar fijo bajo el Navbar al hacer scroll, hero con autoplay, 12 categorías coloreadas y filtros móviles.

## Fases siguientes
- **Fase 6**: página `/events` que recibe `q`, `date`, `price` y `category`.
- **Fase 7**: página de detalle `/events/[slug]`.
