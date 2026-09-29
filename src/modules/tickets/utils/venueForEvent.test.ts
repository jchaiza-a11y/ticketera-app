import { EVENTS, type Event } from "@/modules/events";
import { VENUE_MAP } from "../data/seating.mock";
import { getVenueMapForEvent } from "./venueForEvent";

const event = (slug: string): Event => {
  const found = EVENTS.find((e) => e.slug === slug);
  if (!found) throw new Error(`event ${slug} not found`);
  return found;
};

const prices = (slugOrEvent: string | Event) =>
  getVenueMapForEvent(typeof slugOrEvent === "string" ? event(slugOrEvent) : slugOrEvent).zones.map(
    (zone) => zone.price,
  );

describe("getVenueMapForEvent", () => {
  it("makes the cheapest zone cost exactly the event minPrice", () => {
    expect(Math.min(...prices("noches-de-verano-en-vivo"))).toBe(120);
    expect(Math.min(...prices("muestra-de-arte-contemporaneo"))).toBe(20);
    for (const e of EVENTS) expect(Math.min(...prices(e))).toBe(e.minPrice);
  });

  it("keeps the base price order and rounds the rest to multiples of 5", () => {
    const baseOrder = [...VENUE_MAP.zones].sort((a, b) => a.price - b.price).map((z) => z.id);
    for (const e of EVENTS) {
      const venue = getVenueMapForEvent(e);
      const order = [...venue.zones].sort((a, b) => a.price - b.price).map((z) => z.id);
      expect(order).toEqual(baseOrder);
      const others = venue.zones.filter((z) => z.price !== e.minPrice);
      expect(others.every((z) => z.price % 5 === 0 && z.price > e.minPrice)).toBe(true);
    }
  });

  it("uses the event venue name and keeps seats and shapes", () => {
    const venue = getVenueMapForEvent(event("el-ultimo-telon"));
    expect(venue.name).toBe(event("el-ultimo-telon").venue);
    expect(venue.seats).toBe(VENUE_MAP.seats);
    expect(venue.zones.map((z) => z.shape)).toEqual(VENUE_MAP.zones.map((z) => z.shape));
  });

  it("sells out every zone of a sold-out event and keeps base statuses otherwise", () => {
    const soldOut = getVenueMapForEvent(event("comedia-en-tres-actos"));
    expect(soldOut.zones.every((z) => z.status === "sold-out")).toBe(true);

    const regular = getVenueMapForEvent(event("noches-de-verano-en-vivo"));
    expect(regular.zones.map((z) => z.status)).toEqual(VENUE_MAP.zones.map((z) => z.status));
  });

  it("does not mutate the base map", () => {
    const snapshot = JSON.stringify(VENUE_MAP.zones);
    getVenueMapForEvent(event("comedia-en-tres-actos"));
    getVenueMapForEvent(event("muestra-de-arte-contemporaneo"));
    expect(JSON.stringify(VENUE_MAP.zones)).toBe(snapshot);
  });
});
