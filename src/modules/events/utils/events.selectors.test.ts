import { describe, expect, it } from "vitest";
import type { Event } from "../schemas/events.schema";
import {
  getEventsByCity,
  getFeaturedEvents,
  getUpcomingEvents,
} from "./events.selectors";

const make = (overrides: Partial<Event>): Event => ({
  id: "x",
  slug: "x",
  title: "Evento",
  category: "concert",
  imageUrl: "https://images.unsplash.com/photo-1",
  startsAt: "2026-11-15T20:00:00-05:00",
  venue: "Sala",
  city: "Lima",
  minPrice: 10,
  currency: "PEN",
  featured: false,
  ...overrides,
});

describe("getFeaturedEvents", () => {
  it("returns only featured events", () => {
    const events = [
      make({ id: "1", featured: true }),
      make({ id: "2", featured: false }),
      make({ id: "3", featured: true }),
    ];
    expect(getFeaturedEvents(events).map((e) => e.id)).toEqual(["1", "3"]);
  });
});

describe("getUpcomingEvents", () => {
  const now = new Date("2026-11-01T00:00:00-05:00");

  it("excludes past events and sorts ascending by date", () => {
    const events = [
      make({ id: "late", startsAt: "2026-12-20T20:00:00-05:00" }),
      make({ id: "past", startsAt: "2026-10-01T20:00:00-05:00" }),
      make({ id: "soon", startsAt: "2026-11-05T20:00:00-05:00" }),
    ];
    expect(getUpcomingEvents(events, now, 10).map((e) => e.id)).toEqual([
      "soon",
      "late",
    ]);
  });

  it("respects the limit", () => {
    const events = [
      make({ id: "1", startsAt: "2026-11-05T20:00:00-05:00" }),
      make({ id: "2", startsAt: "2026-11-06T20:00:00-05:00" }),
      make({ id: "3", startsAt: "2026-11-07T20:00:00-05:00" }),
    ];
    expect(getUpcomingEvents(events, now, 2)).toHaveLength(2);
  });

  it("does not mutate the input array", () => {
    const events = [
      make({ id: "b", startsAt: "2026-12-01T20:00:00-05:00" }),
      make({ id: "a", startsAt: "2026-11-05T20:00:00-05:00" }),
    ];
    getUpcomingEvents(events, now, 10);
    expect(events.map((e) => e.id)).toEqual(["b", "a"]);
  });
});

describe("getEventsByCity", () => {
  it("filters by city ignoring case and respects the limit", () => {
    const events = [
      make({ id: "1", city: "Lima" }),
      make({ id: "2", city: "Cusco" }),
      make({ id: "3", city: "lima" }),
      make({ id: "4", city: "LIMA" }),
    ];
    expect(getEventsByCity(events, "LiMa", 2).map((e) => e.id)).toEqual([
      "1",
      "3",
    ]);
  });
});
