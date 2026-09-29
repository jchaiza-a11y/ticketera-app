"use client";

import { useState } from "react";
import { Search, SearchX, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Event } from "../schemas/events.schema";
import {
  EMPTY_EVENT_FILTERS,
  filterEvents,
  getActiveFilterChips,
  getFacetCounts,
  removeFilterChip,
  sortEvents,
  toSearchParams,
  type EventFilters,
  type EventSort,
} from "../utils/events.filters";
import { EventCard } from "./EventCard";
import { EventFiltersPanel } from "./EventFiltersPanel";

const SORT_OPTIONS: { value: EventSort; label: string }[] = [
  { value: "date", label: "Fecha" },
  { value: "price", label: "Precio más bajo" },
];

const countLabel = (count: number) => (count === 1 ? "1 evento" : `${count} eventos`);

interface EventSearchProps {
  events: Event[];
  initialFilters: EventFilters;
}

export function EventSearch({ events, initialFilters }: EventSearchProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [sheetOpen, setSheetOpen] = useState(false);

  const counts = getFacetCounts(events);
  const results = sortEvents(filterEvents(events, filters), filters.sort);
  const chips = getActiveFilterChips(filters);
  const panelFilterCount = chips.filter((chip) => chip.key !== "q").length;

  const updateFilters = (next: EventFilters) => {
    setFilters(next);
    const query = toSearchParams(next).toString();
    // replaceState keeps the URL shareable without a server round-trip on every change.
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  };

  const clearFilters = () => updateFilters({ ...EMPTY_EVENT_FILTERS, sort: filters.sort });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pt-10 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Explora eventos</h1>

      <form
        role="search"
        className="relative mt-5 max-w-2xl"
        onSubmit={(event) => event.preventDefault()}
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={filters.q}
          onChange={(event) => updateFilters({ ...filters, q: event.target.value })}
          placeholder="Artista, evento, lugar o ciudad"
          aria-label="Buscar eventos"
          className="h-12 rounded-xl bg-card pl-12 text-base md:text-base"
        />
      </form>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[272px_minmax(0,1fr)]">
        <aside aria-label="Filtros" className="hidden lg:block">
          <Card className="gap-0 rounded-2xl px-5 py-2">
            <div className="flex h-12 items-center justify-between border-b">
              <h2 className="flex items-center gap-2 font-semibold">
                <SlidersHorizontal className="size-4" />
                Filtros
              </h2>
              {panelFilterCount > 0 && (
                <Button variant="link" className="h-11 px-0" onClick={clearFilters}>
                  Limpiar
                </Button>
              )}
            </div>
            <EventFiltersPanel filters={filters} counts={counts} onChange={updateFilters} />
          </Card>
        </aside>

        <section aria-label="Resultados" className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <p aria-live="polite" className="mr-1 font-semibold">
                {countLabel(results.length)}
              </p>
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  aria-label={`Quitar filtro ${chip.label}`}
                  onClick={() => updateFilters(removeFilterChip(filters, chip.key))}
                  className="flex h-9 items-center gap-1.5 rounded-full border border-primary/25 bg-accent pl-3.5 pr-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  {chip.label}
                  <X className="size-3.5" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger
                  render={<Button variant="outline" className="h-11 gap-2 px-4 lg:hidden" />}
                >
                  <SlidersHorizontal className="size-4" />
                  Filtros{panelFilterCount > 0 && ` (${panelFilterCount})`}
                </SheetTrigger>
                <SheetContent side="right" className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-sm">
                  <SheetHeader className="border-b">
                    <SheetTitle className="text-lg">Filtros</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-4">
                    <EventFiltersPanel filters={filters} counts={counts} onChange={updateFilters} />
                  </div>
                  <SheetFooter className="flex-row gap-2 border-t">
                    <Button variant="outline" className="h-12 px-5" onClick={clearFilters}>
                      Limpiar
                    </Button>
                    <Button className="h-12 flex-1" onClick={() => setSheetOpen(false)}>
                      Ver {countLabel(results.length)}
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <div
                role="group"
                aria-label="Ordenar por"
                className="ml-auto flex gap-1 rounded-xl border bg-card p-1"
              >
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={filters.sort === option.value}
                    onClick={() => updateFilters({ ...filters, sort: option.value })}
                    className={cn(
                      "h-9 rounded-lg px-3 text-sm font-medium transition-colors",
                      filters.sort === option.value
                        ? "bg-foreground text-background"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {results.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-3">
              {results.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed bg-card px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
                <SearchX className="size-7" />
              </span>
              <h2 className="text-xl font-semibold">No encontramos eventos con esos filtros</h2>
              <p className="max-w-md text-muted-foreground">
                Prueba quitando algún filtro o buscando otra ciudad.
              </p>
              <Button className="mt-2 h-11 px-5" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
