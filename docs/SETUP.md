# SETUP

Reglas de estructura, buenas prácticas y metodología de trabajo del proyecto. Aplican a todo el código nuevo, incluidos los componentes de shadcn, funciones, hooks y services.

Stack: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, axios, TanStack Query, TanStack Table, zod, zustand.

---

## 1. Estructura de carpetas

### 1.1 Reglas

1. **Todo se organiza por módulo de dominio** (`users`, `products`, `orders`, ...), no por tipo técnico. Cada módulo agrupa todo lo que necesita para funcionar.
2. **Nombres en inglés**: carpetas, archivos, variables, funciones y tipos.
3. **Naming de TypeScript**:
   - Componentes React: archivo y export en `PascalCase` (`UserCard.tsx`).
   - Hooks: `camelCase` con prefijo `use` (`useUsers.ts`).
   - Services, utilidades, stores, schemas y types: `camelCase` con sufijo que indica su rol (`users.service.ts`, `users.schema.ts`, `users.store.ts`, `users.types.ts`).
   - Carpetas: `kebab-case` (`user-profile`, `order-items`).
   - Tipos e interfaces: `PascalCase` sin prefijo `I` (`User`, `CreateUserInput`).
   - Constantes: `UPPER_SNAKE_CASE`.
4. **App Router**: `src/app` contiene **solo routing** (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`). Las páginas son delgadas: componen componentes del módulo y no contienen lógica de negocio.
5. Los Server Components son el valor por defecto. Se usa `"use client"` únicamente donde hace falta (estado, efectos, eventos, hooks de TanStack Query o zustand).
6. **Un módulo no importa los internos de otro módulo.** Cada módulo expone su API pública mediante un `index.ts`; el resto del proyecto importa desde ahí.
7. Lo que usan varios módulos va en las carpetas compartidas (`components/ui`, `components/shared`, `lib`, `hooks`), nunca duplicado dentro de módulos.
8. Alias de importación: `@/*` apunta a `src/*`.
9. Un archivo, una responsabilidad. Los tests van junto al archivo que prueban (`UserCard.test.tsx`).

### 1.2 Estructura base

```
docs/
  SETUP.md
src/
  app/                          # Solo routing (App Router)
    layout.tsx
    page.tsx
    users/
      page.tsx
      [id]/
        page.tsx
  modules/                      # Un directorio por dominio
    users/
      components/
        UserCard.tsx
        UserCard.test.tsx
        UsersTable.tsx
      hooks/
        useUsers.ts
      services/
        users.service.ts
      schemas/
        users.schema.ts
      store/
        users.store.ts
      types/
        users.types.ts
      index.ts                  # API pública del módulo
    products/
      ...
  components/
    ui/                         # Componentes shadcn (generados y propios reutilizables)
      button.tsx
    shared/                     # Componentes compartidos que no son primitivas de UI
      DataTable.tsx
  hooks/                        # Hooks genéricos, sin dominio
  lib/                          # Utilidades y configuración global
    utils.ts                    # cn()
    axios.ts                    # instancia de axios
    queryClient.ts
  providers/                    # Providers globales (QueryClientProvider, etc.)
```

Solo se crean las subcarpetas de un módulo que realmente se necesiten (YAGNI).

### 1.3 Ejemplo de uso

Módulo `users` con su service, schema, hook, componente y página.

```ts
// src/modules/users/schemas/users.schema.ts
import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
});

export type User = z.infer<typeof userSchema>;
```

```ts
// src/modules/users/services/users.service.ts
import { api } from "@/lib/axios";
import { userSchema, type User } from "../schemas/users.schema";

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get("/users");
  return userSchema.array().parse(data);
}
```

```ts
// src/modules/users/hooks/useUsers.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../services/users.service";

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: getUsers });
}
```

```tsx
// src/modules/users/components/UsersList.tsx
"use client";

import { useUsers } from "../hooks/useUsers";

export function UsersList() {
  const { data, isLoading } = useUsers();

  if (isLoading) return <p>Loading...</p>;
  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

```ts
// src/modules/users/index.ts
export { UsersList } from "./components/UsersList";
export { useUsers } from "./hooks/useUsers";
export type { User } from "./schemas/users.schema";
```

```tsx
// src/app/users/page.tsx  (solo compone, sin lógica)
import { UsersList } from "@/modules/users";

export default function UsersPage() {
  return <UsersList />;
}
```

---

## 2. Buenas prácticas

Se aplican **siempre**, al crear componentes (incluidos los de shadcn), funciones, hooks, services, stores y schemas.

### 2.1 Principios

| Principio | Qué significa aquí |
|-----------|--------------------|
| **SOLID** | **S**: cada componente, hook o service tiene una sola responsabilidad. **O**: se extiende por props/composición, no modificando código existente. **L**: los componentes derivados o variantes deben poder sustituir al base sin romper su contrato. **I**: props e interfaces pequeñas y específicas, sin campos que el consumidor no usa. **D**: los componentes dependen de hooks y services, no de detalles de `axios` o del `fetch` directamente. |
| **DRY** | No se duplica lógica ni UI. Si algo se repite, se extrae a un componente, hook o utilidad reutilizable (con al menos dos usos reales). |
| **KISS** | La solución más simple que funcione. Sin abstracciones ni patrones que el problema no pide. |
| **YAGNI** | No se construye nada "por si acaso". Solo lo que la spec actual requiere. |

### 2.2 Reutilización antes que creación

1. **Componentes de UI: shadcn primero.** Antes de crear un componente, revisar si existe en shadcn (`npx shadcn@latest add <component>`). Si existe, se usa ese.
2. **Si no existe en shadcn, se crea propio**, pensando desde el inicio en que sea reutilizable: props genéricas, sin lógica de dominio, estilos con `cn()` y variantes con `class-variance-authority`. Los componentes propios sin dominio van en `components/ui` o `components/shared`; los que sí dependen de un dominio van en su módulo.
3. **Verificar la existencia antes de crear.** Antes de escribir un componente, función, hook, service, schema o tipo nuevo, buscar en el proyecto si ya existe (o algo equivalente). Si existe, se reutiliza o se extiende; solo se crea uno nuevo si realmente no cubre la necesidad.

### 2.3 Convenciones adicionales

- Validación en los límites del sistema (respuestas de API, formularios) con `zod`; los tipos se infieren del schema (`z.infer`).
- Estado del servidor con TanStack Query; estado global de cliente con zustand. No se duplica estado del servidor en zustand.
- Las llamadas HTTP viven solo en `services/`, usando la instancia de axios de `lib/axios.ts`.
- Las tablas usan TanStack Table sobre los componentes de tabla de shadcn.
- Sin comentarios que expliquen qué hace el código; solo se comenta el porqué cuando no es evidente.

---

## 3. Metodología: SDD (Spec Driven Development)

Ningún código se escribe sin una spec aprobada. La spec es la fuente de verdad: el código se implementa para cumplirla y se revisa contra ella.

### 3.1 Flujo

```
Requerimiento
     |
     v
   Spec  <---------------------- pide cambios ------------------+
     |                                                          |
     v                                                          |
[ APROBACIÓN HUMANA ]  <- gate bloqueante ----------------------+
     |
     v
Desarrollo (+ tests)  <---- correcciones (máx. 2 vueltas) ----+
     |                                                        |
     v                                                        |
  Revisión  --- BLOCKER --------------------------------------+
     |
     v  APROBADO
   Cierre
```

1. **Spec**: se define qué se construye, criterios de aceptación y qué partes requieren tests.
2. **Aprobación humana**: el usuario revisa la spec y la aprueba explícitamente. **Es un gate bloqueante**: sin esa aprobación no se escribe una línea de código. Si pide cambios, se vuelve al paso 1 y el gate se aplica de nuevo.
3. **Desarrollo**: se implementa exactamente lo que dice la spec, respetando las secciones 1 y 2 de este documento.
4. **Revisión**: se verifica que el código cumple la spec, la estructura y las buenas prácticas.
5. **Cierre**: si la revisión aprueba, se entrega; si no, vuelve a la etapa correspondiente.

### 3.2 Agentes

| Agente | Responsabilidad | Entrada | Salida |
|--------|-----------------|---------|--------|
| **Orquestador** | Coordina el flujo completo, asigna el trabajo al agente adecuado, decide si se avanza o se devuelve una etapa y mantiene el contexto entre agentes. No escribe código ni specs. | Requerimiento del usuario | Tarea delegada en cada etapa; resultado final al usuario |
| **Spec** | Convierte el requerimiento en una especificación: alcance, módulo de dominio afectado, componentes/hooks/services a crear o reutilizar, criterios de aceptación y qué se testea. Consulta al usuario si hay dudas. | Requerimiento | Documento de spec |
| **Developer** | Implementa la spec: verifica qué ya existe, reutiliza shadcn y código existente, escribe el código y sus unit tests. No amplía el alcance de la spec. | Spec aprobada | Código y tests |
| **Reviewer** | Revisa el resultado contra la spec y este documento (estructura, naming, SOLID/DRY/KISS/YAGNI, reutilización, tests). Reporta hallazgos concretos; no reescribe el código. | Spec + código | Aprobación o lista de correcciones |

Los cuatro están implementados en `.claude/agents/`: `sdd-orchestrator`, `sdd-spec`, `sdd-developer` y `sdd-reviewer`. El Orquestador es el punto de entrada y decide si la tarea va por SDD o por build directo.

Reglas del flujo:

- Solo el Orquestador se comunica con el usuario y entre agentes.
- **La spec la aprueba el usuario, nunca un agente.** Ningún agente aprueba su propio trabajo, y una spec escrita no es una spec aprobada.
- Si el Developer detecta un hueco en la spec, se devuelve al agente Spec en lugar de improvisar.
- El Reviewer que rechaza indica qué regla o criterio incumple.
- El loop de correcciones tiene un máximo de 2 vueltas. Si a la tercera sigue habiendo un `BLOCKER`, el Orquestador para y consulta al usuario: un loop que no converge en dos intentos tiene un problema en la spec, no en el código.

### 3.3 Unit testing

- Herramientas: **Vitest** y **Testing Library** (`@testing-library/react`).
- Los tests se escriben junto al archivo probado (`useUsers.test.ts`, `UserCard.test.tsx`).
- **Se testea lo que tiene lógica**: services, hooks, stores de zustand, schemas de zod, utilidades, y componentes con comportamiento (interacción, estados condicionales).
- **No se testea**: componentes puramente presentacionales, páginas que solo componen, ni código generado de shadcn sin modificar.
- Se prueba comportamiento observable, no detalles de implementación.
- La spec indica qué secciones requieren tests; el Developer los escribe y el Reviewer verifica que existan.
