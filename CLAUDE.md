# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — dev server (also regenerates the auto-managed block in `AGENTS.md`)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `eslint-config-next`)
- `npm test` / `npm run test:watch` — Vitest + Testing Library (jsdom, globals). Tests must match `src/**/*.test.{ts,tsx}` and live next to the file they cover. Single file: `npm test -- src/lib/utils.test.tsx`; single case: `npm test -- -t "<name>"`.
- Add UI components with `npx shadcn@latest add <component>`.

## Workflow

**Read `docs/SETUP.md` before writing any code.** It is the source of truth for folder structure (domain modules under `src/modules`), TypeScript naming rules, SOLID/DRY/KISS/YAGNI, and the SDD methodology; §3 defines the agent roles below.

### SDD agents (`.claude/agents/`)

| Agent | Role | Writes code |
|---|---|---|
| `sdd-orchestrator` | Entry point. Triages SDD vs direct build, delegates, runs the fix loop, and is the only one that talks to the user | No |
| `sdd-spec` | Turns a requirement into a spec under `docs/specs/`, inventorying what already exists first | Spec file only |
| `sdd-developer` | Implements one sub-task inside its assigned ownership paths; runs test/tsc/lint before handing off | Yes |
| `sdd-reviewer` | Validates code against the spec and SETUP.md; reports BLOCKER/NIT findings | No |

Flow: `requirement → sdd-spec → HUMAN APPROVAL → sdd-developer → sdd-reviewer → close`

**The human approval gate is blocking.** No implementation starts until the user explicitly approves the spec — a written spec is not an approved spec. The orchestrator presents it and stops; `sdd-developer` refuses to run unless told the spec was approved. Correction loops are capped at 2 rounds, then the orchestrator escalates to the user.

Trivial work (one file, no new contracts, localized bugfix, adding an existing shadcn component) skips SDD via triage — the orchestrator announces the mode in one line and the user can override it.

Parallel `sdd-developer` runs are allowed only when the spec gives them disjoint ownership paths. Shared paths (`src/components/ui`, `src/lib`, `src/providers`, `src/app/layout.tsx`, `package.json`) are never written in parallel; they go in a serial step first.

Before creating any component, hook, service, schema or utility, search whether it already exists (project first, then the shadcn registry). Reuse beats creation.

## Stack and architecture

Empty template (course practice project) on Next.js 16 App Router + React 19 + TypeScript + Tailwind CSS v4. All code lives in `src/`; import alias `@/*` maps to `src/*`.

- **Next.js 16 differs from older versions.** Before writing framework code, read the matching guide in `node_modules/next/dist/docs/` (`01-app` is the App Router docs).
- **shadcn/ui** uses the `base-nova` style, which is built on `@base-ui/react` (not Radix), so Radix-based snippets from the web may not apply. Config is in `components.json`; components go to `src/components/ui`, the `cn()` helper is in `src/lib/utils.ts`, hooks alias to `@/hooks`. Theme tokens are CSS variables in `src/app/globals.css` (there is no `tailwind.config`).
- **Installed data/state libraries** (not yet wired up): axios (HTTP), `@tanstack/react-query` v5 (server state), `@tanstack/react-table` v9, zod v4 (validation), zustand v5 (client state). React Query needs a client-component provider mounted in the layout; remember that `layout.tsx`/`page.tsx` are Server Components by default.
- `package.json` also lists a stray `cn` package (not the shadcn helper); the real `cn` is `@/lib/utils`.
