import { PRICE_RANGES } from "@/components/layout/layout.constants";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  type Event,
  type EventCategory,
} from "../schemas/events.schema";

export const EVENT_SORTS = ["date", "price"] as const;
export type EventSort = (typeof EVENT_SORTS)[number];

export interface EventFilters {
  q: string;
  categories: EventCategory[];
  cities: string[];
  month: string | null;
  date: string | null;
  price: string;
  featured: boolean;
  sort: EventSort;
}

export interface FilterChip {
  key: string;
  label: string;
}

export interface FacetCounts {
  categories: Record<EventCategory, number>;
  cities: { city: string; count: number }[];
  months: string[];
}

type SearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

export const EMPTY_EVENT_FILTERS: EventFilters = {
  q: "",
  categories: [],
  cities: [],
  month: null,
  date: null,
  price: "",
  featured: false,
  sort: "date",
};

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const PRICE_VALUES: readonly string[] = PRICE_RANGES.map((range) => range.value);

// en-CA formats as YYYY-MM-DD; events are compared in Lima time, not the browser's.
const limaDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("es-PE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dayFormatter = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const getLimaDay = (iso: string) => limaDayFormatter.format(new Date(iso));

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const isCategory = (value: string): value is EventCategory =>
  (EVENT_CATEGORIES as readonly string[]).includes(value);

function getAll(params: SearchParamsInput, key: string): string[] {
  if (params instanceof URLSearchParams) return params.getAll(key);
  const value = params[key];
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

const getFirst = (params: SearchParamsInput, key: string) =>
  getAll(params, key)[0]?.trim() ?? "";

export function parseEventFilters(params: SearchParamsInput): EventFilters {
  const month = getFirst(params, "month");
  const date = getFirst(params, "date");
  const price = getFirst(params, "price");

  return {
    q: getFirst(params, "q"),
    categories: [...new Set(getAll(params, "category").filter(isCategory))],
    cities: [...new Set(getAll(params, "city").map((c) => c.trim()).filter(Boolean))],
    month: MONTH_PATTERN.test(month) ? month : null,
    date: DATE_PATTERN.test(date) ? date : null,
    price: PRICE_VALUES.includes(price) ? price : "",
    featured: getFirst(params, "featured") === "true",
    sort: getFirst(params, "sort") === "price" ? "price" : "date",
  };
}

export function toSearchParams(filters: EventFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  filters.categories.forEach((category) => params.append("category", category));
  filters.cities.forEach((city) => params.append("city", city));
  if (filters.month) params.set("month", filters.month);
  if (filters.date) params.set("date", filters.date);
  if (filters.price) params.set("price", filters.price);
  if (filters.featured) params.set("featured", "true");
  if (filters.sort !== "date") params.set("sort", filters.sort);
  return params;
}

function matchesPrice(amount: number, range: string): boolean {
  if (!range) return true;
  const [lo, hi] = range.split("-");
  const min = Number(lo);
  const max = hi ? Number(hi) : Infinity;
  // Ranges share their edges ("0-50", "50-100"): the lower bound is exclusive except at 0.
  return (amount > min || min === 0) && amount <= max;
}

export function filterEvents(events: Event[], filters: EventFilters): Event[] {
  const query = normalizeText(filters.q);

  return events.filter((event) => {
    const day = getLimaDay(event.startsAt);
    return (
      (!query ||
        normalizeText(`${event.title} ${event.venue} ${event.city}`).includes(query)) &&
      (filters.categories.length === 0 || filters.categories.includes(event.category)) &&
      (filters.cities.length === 0 || filters.cities.includes(event.city)) &&
      (!filters.month || day.startsWith(filters.month)) &&
      (!filters.date || day === filters.date) &&
      matchesPrice(event.minPrice, filters.price) &&
      (!filters.featured || event.featured)
    );
  });
}

export function sortEvents(events: Event[], sort: EventSort): Event[] {
  const byDate = (a: Event, b: Event) => Date.parse(a.startsAt) - Date.parse(b.startsAt);
  return [...events].sort((a, b) =>
    sort === "price" ? a.minPrice - b.minPrice || byDate(a, b) : byDate(a, b),
  );
}

export function getFacetCounts(events: Event[]): FacetCounts {
  const categories = Object.fromEntries(
    EVENT_CATEGORIES.map((category) => [category, 0]),
  ) as Record<EventCategory, number>;
  const cities = new Map<string, number>();
  const months = new Set<string>();

  for (const event of events) {
    categories[event.category] += 1;
    cities.set(event.city, (cities.get(event.city) ?? 0) + 1);
    months.add(getLimaDay(event.startsAt).slice(0, 7));
  }

  return {
    categories,
    cities: [...cities.entries()]
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city)),
    months: [...months].sort(),
  };
}

export function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return capitalize(monthFormatter.format(new Date(Date.UTC(year, monthIndex - 1, 15))))
    .replace(" de ", " ");
}

function formatDayLabel(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return dayFormatter.format(new Date(Date.UTC(year, month - 1, day))).replace(/\./g, "");
}

export function getActiveFilterChips(filters: EventFilters): FilterChip[] {
  const priceLabel = PRICE_RANGES.find((range) => range.value === filters.price)?.label;

  return [
    ...(filters.q ? [{ key: "q", label: `“${filters.q}”` }] : []),
    ...filters.categories.map((category) => ({
      key: `category:${category}`,
      label: EVENT_CATEGORY_LABELS[category],
    })),
    ...filters.cities.map((city) => ({ key: `city:${city}`, label: city })),
    ...(filters.month ? [{ key: "month", label: formatMonthLabel(filters.month) }] : []),
    ...(filters.date ? [{ key: "date", label: formatDayLabel(filters.date) }] : []),
    ...(filters.price && priceLabel ? [{ key: "price", label: priceLabel }] : []),
    ...(filters.featured ? [{ key: "featured", label: "Destacados" }] : []),
  ];
}

export function removeFilterChip(filters: EventFilters, key: string): EventFilters {
  const [field, value] = key.split(/:(.*)/);
  switch (field) {
    case "q":
      return { ...filters, q: "" };
    case "category":
      return { ...filters, categories: filters.categories.filter((c) => c !== value) };
    case "city":
      return { ...filters, cities: filters.cities.filter((c) => c !== value) };
    case "month":
      return { ...filters, month: null };
    case "date":
      return { ...filters, date: null };
    case "price":
      return { ...filters, price: "" };
    case "featured":
      return { ...filters, featured: false };
    default:
      return filters;
  }
}

export const hasActiveFilters = (filters: EventFilters) =>
  getActiveFilterChips(filters).length > 0;
