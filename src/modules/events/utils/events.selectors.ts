import type { Event } from "../schemas/events.schema";

export function getFeaturedEvents(events: Event[]): Event[] {
  return events.filter((event) => event.featured);
}

export function getUpcomingEvents(
  events: Event[],
  now: Date,
  limit: number,
): Event[] {
  return events
    .filter((event) => new Date(event.startsAt) >= now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, limit);
}

export function getEventsByCity(
  events: Event[],
  city: string,
  limit: number,
): Event[] {
  const target = city.toLowerCase();
  return events
    .filter((event) => event.city.toLowerCase() === target)
    .slice(0, limit);
}
