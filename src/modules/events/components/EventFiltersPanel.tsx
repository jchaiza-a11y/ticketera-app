"use client";

import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PRICE_RANGES } from "@/components/layout/layout.constants";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  type EventCategory,
} from "../schemas/events.schema";
import {
  formatMonthLabel,
  type EventFilters,
  type FacetCounts,
} from "../utils/events.filters";

const ANY_MONTH = "any";

interface EventFiltersPanelProps {
  filters: EventFilters;
  counts: FacetCounts;
  onChange: (filters: EventFilters) => void;
}

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

function FilterGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-0.5 border-b py-4 last:border-b-0">
      <legend className="pb-2 text-sm font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

function OptionRow({ control, label, count }: { control: ReactNode; label: string; count?: number }) {
  return (
    <Label className="min-h-10 cursor-pointer gap-3 font-normal">
      {control}
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      )}
    </Label>
  );
}

export function EventFiltersPanel({ filters, counts, onChange }: EventFiltersPanelProps) {
  const categories = EVENT_CATEGORIES.filter(
    (category) => counts.categories[category] > 0 || filters.categories.includes(category),
  );

  return (
    <div className="flex flex-col">
      <FilterGroup legend="Categoría">
        {categories.map((category: EventCategory) => (
          <OptionRow
            key={category}
            label={EVENT_CATEGORY_LABELS[category]}
            count={counts.categories[category]}
            control={
              <Checkbox
                checked={filters.categories.includes(category)}
                onCheckedChange={() =>
                  onChange({ ...filters, categories: toggle(filters.categories, category) })
                }
              />
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Ciudad">
        {counts.cities.map(({ city, count }) => (
          <OptionRow
            key={city}
            label={city}
            count={count}
            control={
              <Checkbox
                checked={filters.cities.includes(city)}
                onCheckedChange={() =>
                  onChange({ ...filters, cities: toggle(filters.cities, city) })
                }
              />
            }
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Fecha">
        <RadioGroup
          aria-label="Mes"
          className="gap-0.5"
          value={filters.month ?? ANY_MONTH}
          onValueChange={(value) => {
            const month = String(value);
            onChange({ ...filters, month: month === ANY_MONTH ? null : month, date: null });
          }}
        >
          {[ANY_MONTH, ...counts.months].map((month) => (
            <OptionRow
              key={month}
              label={month === ANY_MONTH ? "Cualquier fecha" : formatMonthLabel(month)}
              control={<RadioGroupItem value={month} />}
            />
          ))}
        </RadioGroup>
      </FilterGroup>

      <FilterGroup legend="Precio desde">
        <RadioGroup
          aria-label="Precio"
          className="gap-0.5"
          value={filters.price}
          onValueChange={(value) => onChange({ ...filters, price: String(value) })}
        >
          {PRICE_RANGES.map((range) => (
            <OptionRow
              key={range.value}
              label={range.label}
              control={<RadioGroupItem value={range.value} />}
            />
          ))}
        </RadioGroup>
      </FilterGroup>
    </div>
  );
}
