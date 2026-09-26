"use client";

import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { PRICE_RANGES } from "./layout.constants";

const FILTERS_PANEL_ID = "search-topbar-filters";

export function SearchTopbar() {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="sticky top-16 z-30 w-full border-b bg-background/60 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <form
          action="/events"
          method="get"
          role="search"
          className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:gap-3"
        >
          <div className="flex gap-2 md:contents">
            <Input
              type="search"
              name="q"
              placeholder="Busca un evento o artista"
              aria-label="Evento o artista"
              className="h-11 min-w-0 flex-1 md:order-first"
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 px-3 md:hidden"
              aria-expanded={filtersOpen}
              aria-controls={FILTERS_PANEL_ID}
              onClick={() => setFiltersOpen((prev) => !prev)}
            >
              <SlidersHorizontal className="size-4" />
              Filtros
            </Button>
            <Button type="submit" className="h-11 px-4 md:order-last">
              <Search className="size-4" />
              Buscar
            </Button>
          </div>

          <div
            id={FILTERS_PANEL_ID}
            className={cn(
              "flex-col gap-2 md:contents",
              filtersOpen ? "flex" : "hidden md:contents",
            )}
          >
            <Input
              type="date"
              name="date"
              aria-label="Fecha"
              className="h-11 md:w-44"
            />
            <Select name="price" defaultValue="">
              <SelectTrigger
                aria-label="Precio"
                className="w-full md:w-48 data-[size=default]:h-11"
              >
                <SelectValue placeholder="Cualquier precio">
                  {(value: string) =>
                    PRICE_RANGES.find((range) => range.value === value)
                      ?.label ?? "Cualquier precio"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
      </div>
    </div>
  );
}
