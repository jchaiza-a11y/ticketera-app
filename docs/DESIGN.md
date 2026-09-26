# DESIGN

Sistema de diseño de la Ticketera. Referencias visuales: Ticketmaster (claridad y jerarquía de compra) y Joinnus (energía y cercanía). Los valores de este documento son los de `src/app/globals.css`; si cambian, se cambian en ambos.

## 1. Principios

1. **Las imágenes son las protagonistas.** La UI es sobria y deja que el arte de cada evento aporte el color.
2. **Un solo color de acción.** El coral se reserva para comprar; el índigo es la marca y la navegación. Nada más compite.
3. **Solo modo claro.** No hay tema oscuro; no se usa la clase `.dark`.
4. **Densidad respirada.** Mucho espacio en blanco, tarjetas limpias, una idea por sección.
5. **Shadcn primero.** Se compone con `src/components/ui`; los componentes propios usan los mismos tokens.

## 2. Color

Todos los valores en `oklch` (equivalente aproximado en hex).

| Token | Valor | Hex aprox. | Uso |
|---|---|---|---|
| `background` | `oklch(0.985 0.003 277)` | `#F9F9FC` | Fondo de página |
| `card` / `popover` | `oklch(1 0 0)` | `#FFFFFF` | Tarjetas, menús |
| `foreground` | `oklch(0.22 0.04 277)` | `#1B1B2F` | Texto principal (tinta índigo) |
| `muted-foreground` | `oklch(0.5 0.03 277)` | `#6B6B85` | Texto secundario, metadatos |
| `primary` | `oklch(0.5 0.23 277)` | `#4D42E1` | Marca, enlaces activos, botón principal |
| `primary-foreground` | `oklch(0.99 0 0)` | `#FFFFFF` | Texto sobre primary |
| `secondary` | `oklch(0.96 0.015 277)` | `#F1F0FA` | Botón secundario, chips inactivos |
| `accent` | `oklch(0.955 0.03 277)` | `#EEEBFF` | Hover de items (lo consume shadcn) |
| `brand-accent` | `oklch(0.58 0.21 28)` | `#DB2D27` | CTA de compra, precios destacados |
| `brand-accent-foreground` | `oklch(0.99 0 0)` | `#FFFFFF` | Texto sobre brand-accent |
| `success` | `oklch(0.6 0.15 155)` | `#009956` | Disponible, confirmado |
| `warning` | `oklch(0.78 0.15 75)` | `#E8A317` | Pocas entradas |
| `destructive` | `oklch(0.577 0.245 27.325)` | `#DC2626` | Errores, agotado |
| `border` / `input` | `oklch(0.915 0.01 277)` | `#E4E3EF` | Bordes y campos |
| `ring` | `primary` al 45% | | Foco visible |

**Colores de categoría** (solo para el bloque de icono de `CategoryList`, con icono blanco; se reparten cíclicamente entre las categorías):

| Token | Valor | Hex aprox. |
|---|---|---|
| `primary` | `oklch(0.5 0.23 277)` | `#4D42E1` |
| `brand-accent` | `oklch(0.58 0.21 28)` | `#DB2D27` |
| `success` | `oklch(0.6 0.15 155)` | `#009956` |
| `category-sky` | `oklch(0.6 0.14 235)` | `#008BC7` |
| `category-rose` | `oklch(0.6 0.21 5)` | `#DD316F` |
| `category-amber` | `oklch(0.62 0.15 60)` | `#C66C00` |

Reglas:
- Los colores de categoría no se usan para texto, botones ni fondos de sección.
- `brand-accent` solo en la acción principal de compra ("Comprar entradas", "Desde S/ xx"). Máximo un botón coral por vista.
- `primary` para navegación, enlaces, chips activos y acciones no transaccionales.
- Texto sobre fondos de color: usar siempre el `*-foreground` del par. Los pares `primary`, `brand-accent` y `destructive` con su `*-foreground` cumplen AA (4.5:1) en texto normal. Los colores de categoría (sky, amber, success) no: solo llevan iconos decorativos (3:1).
- No introducir colores fuera de esta tabla; los gráficos usan `chart-1..5`.
- Sobre imágenes, usar un degradado oscuro (`from-black/70 to-transparent`) para asegurar legibilidad del texto blanco.

Tailwind: `bg-primary`, `text-muted-foreground`, `bg-brand-accent text-brand-accent-foreground`, `text-success`, etc.

## 3. Tipografía

Fuente única: **Poppins** (`next/font/google`, variable CSS `--font-poppins`, mapeada a `font-sans`). Pesos cargados: 400, 500, 600, 700. No usar otros pesos ni otra fuente.

| Rol | Clases Tailwind | Peso |
|---|---|---|
| Display (hero) | `text-4xl md:text-6xl leading-tight tracking-tight` | 700 |
| H1 de página | `text-3xl md:text-4xl` | 700 |
| H2 de sección | `text-2xl md:text-3xl` | 600 |
| H3 / título de card | `text-lg` | 600 |
| Cuerpo | `text-base` | 400 |
| Cuerpo pequeño / metadatos | `text-sm text-muted-foreground` | 400 |
| Etiquetas, botones | `text-sm` | 500 |
| Overline (categoría) | `text-xs uppercase tracking-wide` | 600 |

Poppins es ancha: limitar líneas de cuerpo a ~65 caracteres (`max-w-prose`) y usar `leading-relaxed` en párrafos.

## 4. Forma, espacio y elevación

- **Radio base** `--radius: 0.75rem`. Cards `rounded-xl`, botones e inputs `rounded-lg`, chips y badges `rounded-full`.
- **Contenedor:** `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`.
- **Espaciado de secciones:** `py-12 md:py-16`. Entre título de sección y contenido: `mb-6 md:mb-8`. Grillas con `gap-4 md:gap-6`.
- **Grilla de eventos:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- **Sombras:** cards en reposo solo con `border`; en hover `shadow-md` y `-translate-y-0.5`. Nada de sombras pesadas.
- **Movimiento:** `transition-all duration-200`; respetar `prefers-reduced-motion`.
- **Iconos:** `lucide-react`, tamaño `size-4` en botones y `size-5` en navegación, trazo por defecto.

## 5. Componentes shadcn: reglas de uso

| Componente | Uso | Notas |
|---|---|---|
| `button` | `default` = primary; **CTA de compra**: `default` con `className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"`; `outline`/`ghost` para acciones secundarias | Si el CTA coral se repite, extraerlo a una variante `cta` con `cva` en `button.tsx` |
| `badge` | Categoría del evento y estados ("Últimas entradas" en `warning`, "Agotado" en `destructive`) | `rounded-full`, texto `text-xs` |
| `card` | Contenedor de `EventCard` y bloques de contenido | Imagen a sangre arriba, `overflow-hidden` |
| `input` | Buscador y newsletter | Alto `h-11` en el buscador principal |
| `select` | Ciudad, fecha, filtros | |
| `carousel` | "Próximos eventos" (Embla, ya incluido) | El hero usa Swiper (ver abajo) |
| Swiper (`swiper`) | Solo el hero: `Autoplay` (6 s, pausa al pasar el mouse), `Pagination` clickable y `Navigation` | Autoplay desactivado con `prefers-reduced-motion`; no usarlo en otras secciones |
| `sheet` | Menú móvil del navbar | Lado derecho |
| `navigation-menu` | Categorías en el navbar (escritorio) | |
| `dropdown-menu` | Cuenta de usuario, ciudad | |
| `skeleton` | Estados de carga de cards | |

Antes de crear un componente propio, buscar en shadcn (`npx shadcn@latest add <nombre>`); si se crea, va en `components/ui` o `components/shared` con `cva` y tokens de este documento.

## 6. Patrones de página

- **Sección:** `<section>` con contenedor, `H2` + enlace "Ver todos" alineado a la derecha, y contenido debajo.
- **Card de evento:** imagen `aspect-[4/3]` con `next/image`, badge de categoría sobre la imagen, fecha (`text-primary`, 600), título (`line-clamp-2`), lugar y ciudad (`text-sm text-muted-foreground`), y "Desde S/ xx" en `text-brand-accent` (600).
- **Hero:** carrusel a ancho de contenedor, imagen `aspect-[16/9] md:aspect-[21/9]`, degradado inferior, título en Display blanco y un CTA coral.
- **Fondo degradado:** los primeros `100vh` de la página llevan un degradado vertical de arriba hacia abajo (`from-primary/25 via-primary/10 to-transparent`), definido en `layout.tsx` detrás del contenido. Navbar y topbar son translúcidos (`bg-background/60 backdrop-blur-md`) para que el degradado se vea a través de ellos; al hacer scroll fuera del primer viewport quedan como barras blanquecinas con desenfoque.
- **Navbar:** translúcido (ver arriba), `h-16`, `sticky top-0 z-40`, borde inferior `border`; escritorio con logo, hasta 6 categorías y "Ingresar"; móvil con `sheet` que lista todas las categorías.
- **Topbar de búsqueda:** translúcido, `sticky top-16 z-30` (justo bajo el Navbar) con borde inferior; campos de texto, fecha y precio (rangos predefinidos) y botón Buscar. En móvil muestra el texto y un botón "Filtros" que despliega fecha y precio. Se monta en `layout.tsx`.
- **Categorías:** cada una en un card con borde, bloque de icono `size-14 rounded-2xl` de color de categoría con icono blanco `size-7`.
- **Footer:** fondo `foreground` (tinta índigo) con texto claro; es la única zona oscura permitida.

## 7. Imágenes

- Origen: Unsplash (`images.unsplash.com`, habilitado en `next.config.ts`). URLs con parámetros de tamaño (`?auto=format&fit=crop&w=1200&q=80`).
- Siempre `next/image` con `alt` descriptivo y `sizes` acorde a la grilla; `priority` solo en la imagen del hero.
- Recorte consistente por proporción (ver §6); nunca estirar.

## 8. Accesibilidad

- Contraste AA mínimo en todo texto; el coral solo lleva texto blanco.
- Foco visible en todo elemento interactivo (`focus-visible:ring-3 ring-ring`, ya incluido en shadcn).
- Áreas táctiles de al menos 44×44 px en móvil.
- Carruseles con controles anteriores/siguientes accesibles. Solo el hero tiene autoplay (6 s), que se pausa al pasar el mouse y no corre con `prefers-reduced-motion`.
- `lang="es"` en `<html>`.
