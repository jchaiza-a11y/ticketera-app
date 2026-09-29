import { EVENTS } from "../data/events.mock";
import type { Event } from "../schemas/events.schema";
import { getEventDetails, getRelatedEvents } from "./events.details";

const event = (slug: string): Event => {
  const found = EVENTS.find((e) => e.slug === slug);
  if (!found) throw new Error(`event ${slug} not found`);
  return found;
};

describe("getEventDetails", () => {
  it("opens doors one hour before the show, in Lima time", () => {
    const details = getEventDetails(event("noches-de-verano-en-vivo"));
    expect(details.startsAt).toBe("8:00 p. m.");
    expect(details.doorsOpenAt).toBe("7:00 p. m.");
  });

  it("sets the minimum age by category", () => {
    expect(getEventDetails(event("festival-de-los-ninos")).minimumAge).toBe("Todo público");
    expect(getEventDetails(event("noche-de-cocteles")).minimumAge).toBe("+18");
    expect(getEventDetails(event("noches-de-verano-en-vivo")).minimumAge).toBe("+14");
  });

  it("writes a description that names the event, venue and city", () => {
    const e = event("el-ultimo-telon");
    const { description } = getEventDetails(e);
    expect(description).toContain(e.title);
    expect(description).toContain(e.venue);
    expect(description).toContain(e.city);
  });
});

describe("getRelatedEvents", () => {
  it("returns up to 4 events, same category first, without itself or sold-out ones", () => {
    const e = event("noches-de-verano-en-vivo");
    const related = getRelatedEvents(EVENTS, e);

    expect(related).toHaveLength(4);
    expect(related.map((r) => r.id)).not.toContain(e.id);
    expect(related.some((r) => r.badge === "sold-out")).toBe(false);

    const sameCategory = EVENTS.filter(
      (r) => r.category === e.category && r.id !== e.id && r.badge !== "sold-out",
    ).length;
    expect(related.slice(0, sameCategory).every((r) => r.category === e.category)).toBe(true);
  });

  it("fills with events from the same city after the category matches", () => {
    const e = event("noche-de-cocteles");
    const related = getRelatedEvents(EVENTS, e, 3);
    expect(related).toHaveLength(3);
    expect(related.every((r) => r.category === e.category || r.city === e.city)).toBe(true);
  });
});
