# Design system foundation (Fase 1 de la landing)

## Metadatos
- Fecha: 2026-09-25
- Módulo de dominio: shared (sin módulo de dominio)
- Requerimiento: "Construir la UI de la landing de la Ticketera con mock data, usando en su mayoría componentes shadcn, un documento de diseño con colores modernos pero no sobrecargados, solo modo claro, Poppins en todo el proyecto y referencia visual Ticketmaster / Joinnus."

## Objetivo
Al terminar, el proyecto tiene un documento de diseño (`docs/DESIGN.md`) y sus tokens aplicados en código: paleta índigo + acento coral, Poppins como única fuente, solo modo claro y las imágenes remotas de Unsplash habilitadas. Toda page posterior (incluida la landing, Fase 2+) se construye sobre estos tokens sin decidir estilo de nuevo.

## Fuera de alcance
- Cualquier sección de la landing, Navbar, Footer o componente de evento (Fases 2 a 4).
- Mock data, tipos y schemas de eventos.
- Instalar componentes shadcn nuevos (cada fase instala los que use).
- Modo oscuro (se elimina, no se soporta).
- Nueva librería de iconos o de slides: se usa `lucide-react` (ya instalada) y el `Carousel` de shadcn (Embla) en fases posteriores.

## Inventario de reutilización
| Pieza | Búsqueda hecha | ¿Existe? | Decisión |
|---|---|---|---|
| `Button` | `ls src/components/ui/` | Sí, en el proyecto | Reusar; solo cambian los tokens que consume |
| Iconos | `package.json`, `grep -r lucide src` | `lucide-react` instalada, sin usos aún | Reusar; no instalar otra |
| Fuente Poppins | `grep -rn Poppins src` | No; el layout usa Geist | Reemplazar por `Poppins` de `next/font/google` |
| Tokens de color | `globals.css` (`:root` y `.dark`) | Sí, tokens neutros por defecto de shadcn | Editar valores; eliminar bloque `.dark` |
| Configuración de imágenes remotas | `ls next.config.*` | `next.config.ts` existe sin `images` | Añadir `remotePatterns` para `images.unsplash.com` |
| Documento de diseño | `ls docs/` | No; solo `SETUP.md` | Crear `docs/DESIGN.md` |
| Skill `ui-ux-pro-max` | lista de skills de la sesión | No disponible | El documento se redacta con criterio propio; la persona lo revisa en la aprobación |

## Cambios por archivo
| Ruta | Acción | Qué contiene |
|---|---|---|
| `docs/DESIGN.md` | crear | Principios; paleta (tokens y hex); tipografía Poppins (pesos 400/500/600/700 y escala); radios, sombras, espaciado y contenedor; reglas de uso por componente shadcn; patrones de página (sección, grilla de cards, carrusel); reglas de imágenes; accesibilidad (contraste AA, foco visible) |
| `src/app/globals.css` | editar | Valores de `:root` con la paleta (`--primary` índigo, `--accent`/`--brand-accent` coral, neutros cálidos, `--ring`, `--radius`); `--font-sans` apuntando a Poppins; eliminar `@custom-variant dark` y el bloque `.dark` |
| `src/app/layout.tsx` | editar | `Poppins` con `variable: "--font-poppins"` y pesos 400/500/600/700; quitar Geist; `lang="es"`; metadata con nombre de la ticketera |
| `next.config.ts` | editar | `images.remotePatterns` para `images.unsplash.com` |

## Paso previo en serie
Las 3 rutas de código de esta spec (`globals.css`, `layout.tsx`, `next.config.ts`) son rutas compartidas y se escriben en serie por una sola sub-tarea. `docs/DESIGN.md` se escribe primero y las demás lo siguen como fuente de verdad.

## Sub-tareas paralelizables
Sub-tarea única, sin paralelismo: los 4 archivos son pocos, tres son rutas compartidas y los valores del código derivan del documento, así que van en orden.

## Criterios de aceptación
- **AC-1**: `docs/DESIGN.md` define, con valores concretos, la paleta (primario índigo, acento coral, neutros, estados), la escala tipográfica en Poppins, radios, sombras y espaciado, y lista las reglas de uso de al menos los componentes que usará la landing (`button`, `badge`, `card`, `input`, `carousel`, `sheet`, `select`, `navigation-menu`).
- **AC-2**: Todos los tokens de color de `:root` en `globals.css` coinciden con los valores de `docs/DESIGN.md`, y no existe el bloque `.dark`. Se conserva `@custom-variant dark (&:is(.dark *))` (sin clase `.dark` nunca se activa) para que las clases `dark:` de shadcn no sigan `prefers-color-scheme`.
- **AC-3**: `layout.tsx` carga únicamente Poppins (pesos 400, 500, 600, 700) con `next/font/google`, y `--font-sans` resuelve a Poppins, de modo que no queda referencia a Geist en `src/`.
- **AC-4**: `next.config.ts` permite imágenes de `images.unsplash.com`, y `npm run build` termina sin errores.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `docs/DESIGN.md` | sin test | Documento |
| `globals.css`, `layout.tsx`, `next.config.ts` | sin test | Configuración y estilos sin lógica (SETUP.md §3.3) |

## Verificación
```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Fases siguientes
- **Fase 2**: módulo `events` con tipos, schema zod, mock data y `EventCard` (instala `badge` y `card`).
- **Fase 3**: `Navbar` y `Footer` compartidos, con `sheet`, `input`, `navigation-menu` y `dropdown-menu`.
- **Fase 4**: secciones de la landing (hero, búsqueda, categorías, destacados, próximos, CTA, newsletter) y composición en `src/app/page.tsx`, con `carousel`, `select` y `skeleton`.
