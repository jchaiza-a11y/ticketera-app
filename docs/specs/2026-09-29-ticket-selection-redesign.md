# Rediseño de la selección de entradas y del mapa de asientos (Fase 3a)

## Metadatos
- Fecha: 2026-09-29
- Módulo de dominio: tickets
- Requerimiento: "En la sección de Elige tu zona / Elige tus asientos / Entradas no termino de entender el UX/UI: rediseña esa sección. Además mejora la librería de selección de asientos, se ve muy básica; busca referencias."

## Diagnóstico de la versión actual
1. **Tres controles para lo mismo.** La zona se elige en el mapa, pero también en la tarjeta "Entradas" de abajo; la cantidad de campo aparece en dos steppers; el resumen está en una tercera tarjeta. No queda claro dónde se decide cada cosa.
2. **El mapa cambia de contenido sin aviso.** Al tocar una tribuna, el mapa de zonas desaparece y es reemplazado por las butacas; la única salida es un botón "Todas las zonas".
3. **Asientos poco legibles.** Son círculos iguales, sin pasillos ni orientación, y no muestran el precio ni el estado hasta leer el resumen. Tampoco hay minimapa: con zoom, uno se pierde.
4. **Colores sin significado.** Los tonos de las zonas no se explican con ninguna leyenda de precios.

## Referencias
- Ticketmaster y SeatGeek: mapa grande y panel lateral único, zonas coloreadas por precio con leyenda, tooltip al pasar o tocar con precio y estado, y asientos elegidos listados con opción de quitarlos.
- Buenas prácticas de venta de entradas ([neuronimbus](https://www.neuronimbus.com/blog/online-ticket-purchase-ux-best-practices-boost-ticket-sales-now/), [vivenu](https://vivenu.com/blog/best-ticketing-system-seat-map-accuracy)): precio y resumen inmediatos al tocar un asiento, colores y etiquetas "sin decodificar", áreas táctiles amplias en móvil, SVG escalable.

## Decisión sobre la librería
Se mantiene **SVG propio + `react-zoom-pan-pinch`**; lo básico era el dibujo, no el motor. Alternativas revisadas y descartadas:
- `seat-picker`: v0.0.13, editor sobre canvas (fabric).
- SeatLayer y Seatmap.pro: SDK comerciales con backend propio.
- `react-konva`: exige React 19.3; el proyecto usa 19.2.8.

`react-zoom-pan-pinch` ya trae `MiniMap`, que se aprovecha.

## Objetivo: nuevo diseño
**Estructura (escritorio):** lienzo del mapa a la izquierda y **un único panel "Tu compra"** a la derecha, en dos pasos visibles.

- **Mapa** con migas "Estadio › Tribuna Occidente".
  - **Vista de zonas:** escenario, campo y tribunas con forma de estadio. Cada zona va coloreada por nivel de precio, con una leyenda de precios debajo.
  - **Tooltip** al pasar o enfocar una zona: nombre, precio y disponibilidad.
  - **Contador sobre la zona** con los asientos ya elegidos en ella.
  - Al entrar a una tribuna, el mapa hace una **transición de zoom** a la vista de butacas.
- **Butacas:**
  - Forma de asiento (respaldo y base), no círculos.
  - Pasillos: bloques 1–5 | 6–15 | 16–20.
  - Filas rotuladas a ambos lados y arco "ESCENARIO" orientado.
  - Estados claros: disponible en el color de la zona, seleccionado en `primary` con check, ocupado en gris con trama, y bloqueado por el tope en tono atenuado.
  - Tooltip con "Fila C · Asiento 12 · S/ 180.00".
  - `MiniMap` en escritorio y controles agrupados: acercar, alejar y encuadrar.
- **Panel "Tu compra":**
  - **Paso 1, "Zona":** lista de zonas con muestra de color idéntica a la del mapa, precio, "Numerada"/"General" y badge de estado. Pasar el cursor por una fila resalta su zona en el mapa, y viceversa.
  - **Paso 2, según la zona:**
    - *General:* un solo stepper de cantidad.
    - *Numerada:* instrucción "Toca los asientos en el mapa" y los asientos elegidos como chips "Fila C · 12 ✕" para quitarlos.
  - **Resumen:** líneas, total, "Máximo 6 entradas" y el único CTA coral "Continuar".
- **Móvil:** mapa a ancho completo con pinch y tooltip al tocar; debajo, el mismo panel; barra fija inferior con total, un botón "Ver selección" que despliega las líneas, y "Continuar".
- Se elimina la tarjeta "Entradas" duplicada.

## Fuera de alcance
- Vista desde el asiento (foto), "mejor asiento disponible" automático y reserva temporal de asientos en tiempo real.
- Cambios en el reducer de selección, en el store de pedidos o en el checkout.

## Inventario de reutilización
| Pieza | Decisión |
|---|---|
| `seatSelectionReducer`, `getSelectionSummary` | Reusar sin cambios (la lógica ya está probada) |
| `react-zoom-pan-pinch` (`TransformWrapper`, `MiniMap`, `useControls`) | Reusar |
| `PurchaseSteps`, `Button` `cta`, `Badge`, `Card` | Reusar |
| Colores por precio | Crear `getZonePalette(zones)` puro: ordena por precio y asigna tonos de `primary` (del más caro al más barato) + gris para agotado |
| Tooltip | shadcn `tooltip` no está en el proyecto y el registro está bloqueado: tooltip propio posicionado en el SVG (`<foreignObject>` no; se usa un `div` absoluto sobre el lienzo con coordenadas del elemento) |

## Cambios por archivo
| Ruta | Acción | Qué contiene |
|---|---|---|
| `src/modules/tickets/data/seating.mock.ts` | modificar | Butacas con pasillos (hueco tras la 5 y la 15), sin cambiar ids ni estados (los tests existentes siguen válidos) |
| `src/modules/tickets/utils/zonePalette.ts` (+ test) | crear | `getZonePalette(zones)` → `Map<zoneId, { fill, soft, text, swatch }>` por nivel de precio; `getPriceLegend(zones, currency)` |
| `src/modules/tickets/components/ZoneMap.tsx` | crear | Vista de zonas en SVG con forma de estadio, hover/focus sincronizado, tooltip, contador y leyenda |
| `src/modules/tickets/components/SeatMap.tsx` | reescribir | Butacas con forma de asiento, pasillos, arco de escenario, estados, tooltip, `MiniMap` y controles |
| `src/modules/tickets/components/SelectionPanel.tsx` (+ test) | crear | Panel "Tu compra": lista de zonas, paso 2 (stepper o chips), resumen y CTA; también se usa en la hoja móvil |
| `src/modules/tickets/components/TicketSelection.tsx` | reescribir | Orquesta el estado (reducer, zona activa, zona resaltada) y compone mapa + panel + barra móvil |

> **Desvío del presupuesto:** 8 archivos (límite 6) en un solo módulo. El rediseño exige separar mapa, butacas y panel para que cada uno tenga una sola responsabilidad.

## Criterios de aceptación
- **AC-1**: `getZonePalette` asigna el tono más intenso a la zona más cara y gris a las agotadas; `getPriceLegend` devuelve los niveles ordenados. Las butacas tienen pasillos tras la 5 y la 15, y los ids no cambian.
- **AC-2 (SelectionPanel, Testing Library)**:
  - Tocar una zona general muestra un único stepper.
  - Tocar una tribuna muestra "Toca los asientos en el mapa".
  - Un chip "Fila C · 12" con ✕ quita ese asiento.
  - "Continuar" está deshabilitado sin entradas.
- **AC-3 (navegador)**:
  - Pasar el cursor por una zona del panel la resalta en el mapa, y viceversa.
  - El tooltip muestra el precio.
  - Entrar a una tribuna hace zoom a sus butacas, con migas para volver.
  - Los asientos muestran estados distintos y el `MiniMap` refleja el encuadre.
  - Solo existe un control por decisión: sin tarjeta "Entradas" duplicada y sin dos steppers.
- **AC-4**: a 390 px no hay scroll horizontal, el pinch funciona y la barra inferior muestra total, "Ver selección" y "Continuar". `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build` terminan sin errores.

## Plan de tests
| Pieza | Orden | Qué se prueba |
|---|---|---|
| `zonePalette.ts`, mock con pasillos | `test-first` | AC-1 |
| `SelectionPanel.tsx` | `test-first` (Testing Library) | AC-2 |
| `ZoneMap`, `SeatMap`, `TicketSelection` | navegador | AC-3, AC-4 con capturas a 390 y 1440 px |
