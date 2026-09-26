# next-js-template

Template de desarrollo sobre **Next.js 16 (App Router)** para la clase de práctica. Trae el stack ya instalado, reglas de estructura y buenas prácticas documentadas, y cuatro agentes de Claude Code que implementan una metodología **SDD (Spec Driven Development)**.

El proyecto arranca vacío a propósito: no hay módulos de dominio todavía. La idea es que cada feature se construya siguiendo las reglas de [`docs/SETUP.md`](docs/SETUP.md).

## Stack

| Área | Librería |
|---|---|
| Framework | Next.js `16.3.6` (App Router) · React `19.2.8` |
| Lenguaje | TypeScript `5` (strict), alias `@/*` → `src/*` |
| Estilos | Tailwind CSS `4` (tokens CSS, sin `tailwind.config`) |
| Componentes | shadcn/ui (estilo `base-nova`, sobre `@base-ui/react`) · `lucide-react` |
| HTTP | axios `1.20` |
| Estado servidor | TanStack Query `5` |
| Estado cliente | zustand `5` |
| Tablas | TanStack Table `9` |
| Validación | zod `4` |
| Tests | Vitest `5` + Testing Library (jsdom) |
| Lint | ESLint `9` (flat config) + `eslint-config-next` |

## Requisitos

- **Node.js 22.12+** (se desarrolló con `24.19.0`). Vitest 5 y Vite 8 no soportan Node 20.
- npm (se usó `11.17.0`).

## Arranque

```bash
npm install
npm run dev
```

La app queda en `http://localhost:3000`.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build |
| `npm run lint` | ESLint |
| `npm test` | Corre los tests una vez |
| `npm run test:watch` | Tests en modo watch |
| `npx tsc --noEmit` | Chequeo de tipos |
| `npx shadcn@latest add <componente>` | Agrega un componente de shadcn |

Los tests tienen que matchear `src/**/*.test.{ts,tsx}` y vivir al lado del archivo que prueban.

```bash
npm test -- src/lib/utils.test.tsx   # un archivo
npm test -- -t "merges classes"      # un caso
```

## Estructura

```
docs/
  SETUP.md                  # Reglas del proyecto: LEER ANTES DE CODEAR
  specs/                    # Specs SDD (se crea con la primera spec)
.claude/
  agents/                   # Los 4 agentes SDD
src/
  app/                      # SOLO routing (page, layout, loading, error, route)
  modules/                  # Un directorio por dominio (users, products, ...)
    <dominio>/
      components/ hooks/ services/ schemas/ store/ types/
      index.ts              # API pública del módulo
  components/
    ui/                     # Componentes shadcn
    shared/                 # Componentes compartidos propios
  hooks/                    # Hooks genéricos, sin dominio
  lib/                      # utils.ts (cn), axios.ts, queryClient.ts
  providers/                # Providers globales
```

`src/modules`, `src/hooks`, `src/providers` y `docs/specs` todavía no existen: se crean cuando la primera feature los necesite (YAGNI).

### Reglas en corto

- Todo se organiza **por módulo de dominio**, no por tipo técnico.
- Nombres en **inglés**. Componentes `PascalCase`, hooks `useX`, carpetas `kebab-case`, services/schemas/stores con sufijo (`users.service.ts`).
- `src/app` es solo routing; la lógica vive en el módulo.
- Server Components por defecto; `"use client"` solo donde hace falta.
- Un módulo no importa los internos de otro: se pasa por su `index.ts`.
- **Antes de crear un componente, hook o función, verificá que no exista ya** (primero en el proyecto, después en el registro de shadcn).
- SOLID, DRY, KISS y YAGNI aplican siempre.

Todo el detalle está en [`docs/SETUP.md`](docs/SETUP.md).

## Cómo trabajamos: SDD

```
Requerimiento → Spec → APROBACIÓN HUMANA → Desarrollo (+ tests) → Revisión → Cierre
```

Los cuatro agentes viven en `.claude/agents/`:

| Agente | Rol | Escribe código |
|---|---|---|
| `sdd-orchestrator` | Punto de entrada. Decide SDD o build directo, delega, sostiene el loop de corrección | No |
| `sdd-spec` | Convierte el requerimiento en una spec en `docs/specs/` | Solo la spec |
| `sdd-developer` | Implementa una sub-tarea dentro de sus rutas asignadas | Sí |
| `sdd-reviewer` | Valida contra la spec y `SETUP.md`; reporta `BLOCKER` / `NIT` | No |

Para usarlo, desde la sesión principal de Claude Code:

```
usá el orquestador SDD para agregar el módulo de products
```

Puntos clave:

- **La aprobación de la spec es un gate bloqueante.** Sin un sí explícito de una persona no se escribe código.
- Las tareas triviales (un archivo, sin contratos nuevos) se saltan SDD; el orquestador anuncia el modo en una línea y podés overridearlo.
- El loop de correcciones corta a las 2 vueltas y escala a la persona.
- Se puede paralelizar solo si las sub-tareas tienen rutas de ownership disjuntas.

## Skills y plugins recomendados

Se instalan desde Claude Code con `/plugin`. El marketplace oficial ya viene registrado; el comunitario hay que agregarlo una vez.

```
/plugin marketplace add anthropics/claude-plugins-community
```

### Verificados y recomendados

| Plugin | Para qué sirve acá | Instalación |
|---|---|---|
| **superpowers** | Brainstorming, TDD red/green, debugging sistemático y code review. Es la base metodológica que se lleva bien con SDD. | `/plugin install superpowers@claude-plugins-official` |
| **frontend-design** | Interfaces con criterio de diseño real, evitando la estética genérica de IA. El complemento natural de shadcn + Tailwind. | `/plugin install frontend-design@claude-plugins-official` |
| **vercel** | Deploys, build status, logs y dominios desde Claude Code. | `/plugin install vercel@claude-plugins-official` |
| **ponytail** | "Lazy senior dev mode": fuerza la solución más simple que funciona. Refuerza KISS y YAGNI, que son reglas de este proyecto. | `/plugin install ponytail@claude-community` |
| **caveman** | Recorta ~65% los tokens de salida: el agente responde en estilo telegráfico ("caveman speak"), con frases cortas y sin conectores, pero deja intactos el código, las URLs y la precisión técnica. Tiene niveles `lite` / `full` / `ultra` y se activa con `/caveman` o diciendo "caveman mode". | `/plugin install caveman@claude-community` |

### Sobre dos que se pidieron y no existen

- **`ux-ui-pro-max`**: no está en el marketplace oficial (311 plugins) ni en el comunitario (2282). Si el nombre venía de otra fuente, hay que agregar ese marketplace a mano. Alternativas verificadas que cubren lo mismo: `ux-superpowers` (metodología de descubrimiento UX antes de codear), `superdesign` y `ui-theme-designer`.
- **`vercel-labs`**: no existe un plugin con ese nombre. El oficial de Vercel se llama `vercel` y es el de la tabla de arriba.

> `ponytail` y `caveman` son de autores independientes (`DietrichGebert/ponytail` y `JuliusBrussee/caveman`), no de Anthropic. El marketplace comunitario no está curado, así que conviene revisar el repo antes de instalar.

## Pendientes conocidos

- `package.json` incluye un paquete `cn` que no se usa: el helper real es `cn()` de `src/lib/utils.ts`. Se puede quitar con `npm uninstall cn`.
- `src/lib/utils.test.tsx` es un test de humo para verificar que Vitest y el JSX funcionan. Se puede borrar cuando haya tests reales.
- TanStack Query todavía no tiene su provider montado en el layout: hace falta un client component en `src/providers/`.
- npm avisa que el script de instalación de `unrs-resolver` está pendiente de aprobación (`npm approve-scripts`).
