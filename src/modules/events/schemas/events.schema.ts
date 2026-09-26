import { z } from "zod";

export const EVENT_CATEGORIES = [
  "concert",
  "sports",
  "theater",
  "festival",
  "family",
  "conference",
  "comedy",
  "cinema",
  "gastronomy",
  "nightlife",
  "exhibition",
  "course",
] as const;

export const eventSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(EVENT_CATEGORIES),
  imageUrl: z.url(),
  startsAt: z.iso.datetime({ offset: true }),
  venue: z.string().min(1),
  city: z.string().min(1),
  minPrice: z.number().nonnegative(),
  currency: z.string().length(3),
  badge: z.enum(["low-stock", "sold-out"]).optional(),
  featured: z.boolean(),
});

export type Event = z.infer<typeof eventSchema>;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  concert: "Conciertos",
  sports: "Deportes",
  theater: "Teatro",
  festival: "Festivales",
  family: "Familia",
  conference: "Conferencias",
  comedy: "Comedia",
  cinema: "Cine",
  gastronomy: "Gastronomía",
  nightlife: "Vida nocturna",
  exhibition: "Exposiciones",
  course: "Cursos y talleres",
};
