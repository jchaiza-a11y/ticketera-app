import { EVENTS } from "../data/events.mock";
import {
  EMPTY_EVENT_FILTERS,
  filterEvents,
  formatMonthLabel,
  getActiveFilterChips,
  getFacetCounts,
  parseEventFilters,
  removeFilterChip,
  sortEvents,
  toSearchParams,
  type EventFilters,
} from "./events.filters";

const withFilters = (patch: Partial<EventFilters>): EventFilters => ({
  ...EMPTY_EVENT_FILTERS,
  ...patch,
});

describe("parseEventFilters", () => {
  it("reads every supported param, including repeated categories", () => {
    const filters = parseEventFilters(
      new URLSearchParams(
        "q=%20Verano%20&category=concert&category=family&city=Lima&month=2026-11&price=50-100&featured=true&sort=price",
      ),
    );
    expect(filters).toEqual({
      q: "Verano",
      categories: ["concert", "family"],
      cities: ["Lima"],
      month: "2026-11",
      date: null,
      price: "50-100",
      featured: true,
      sort: "price",
    });
  });

  it("accepts the searchParams object Next passes to pages", () => {
    const filters = parseEventFilters({ category: ["sports", "theater"], date: "2026-11-15" });
    expect(filters.categories).toEqual(["sports", "theater"]);
    expect(filters.date).toBe("2026-11-15");
  });

  it("drops invalid values", () => {
    const filters = parseEventFilters(
      new URLSearchParams("category=opera&price=1-2&month=noviembre&date=15/11/2026&sort=random&featured=yes"),
    );
    expect(filters).toEqual(EMPTY_EVENT_FILTERS);
  });

  it("round-trips through toSearchParams", () => {
    const params = "q=rock&category=concert&city=Cusco&month=2026-12&price=200-&sort=price";
    const once = toSearchParams(parseEventFilters(new URLSearchParams(params)));
    const twice = toSearchParams(parseEventFilters(once));
    expect(twice.toString()).toBe(once.toString());
    expect(toSearchParams(EMPTY_EVENT_FILTERS).toString()).toBe("");
  });
});

describe("filterEvents", () => {
  it("matches text ignoring accents and case", () => {
    const cusco = filterEvents(EVENTS, withFilters({ q: "cusco" }));
    expect(cusco.length).toBeGreaterThan(0);
    expect(cusco.every((e) => e.city === "Cusco" || /cusco/i.test(e.title + e.venue))).toBe(true);

    const clasico = filterEvents(EVENTS, withFilters({ q: "CLASICO" }));
    expect(clasico.map((e) => e.title)).toContain("Clásico del Pacífico");
  });

  it("ORs within a group and ANDs across groups", () => {
    const result = filterEvents(
      EVENTS,
      withFilters({ categories: ["concert", "family"], cities: ["Lima"] }),
    );
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every((e) => ["concert", "family"].includes(e.category) && e.city === "Lima"),
    ).toBe(true);
    expect(result.some((e) => e.category === "concert")).toBe(true);
    expect(result.some((e) => e.category === "family")).toBe(true);
  });

  it("filters by price range, month and day in Lima time", () => {
    const upTo50 = filterEvents(EVENTS, withFilters({ price: "0-50" }));
    expect(upTo50.every((e) => e.minPrice <= 50)).toBe(true);

    const over200 = filterEvents(EVENTS, withFilters({ price: "200-" }));
    expect(over200.every((e) => e.minPrice > 200)).toBe(true);

    const november = filterEvents(EVENTS, withFilters({ month: "2026-11" }));
    expect(november.length).toBeGreaterThan(0);
    expect(november.every((e) => e.startsAt.startsWith("2026-11"))).toBe(true);

    // 22:00 in Lima is already the next day in UTC; it must still count as the 27th.
    const byDay = filterEvents(EVENTS, withFilters({ date: "2026-11-27" }));
    expect(byDay.map((e) => e.startsAt)).toEqual(["2026-11-27T22:00:00-05:00"]);
  });

  it("filters featured events", () => {
    const featured = filterEvents(EVENTS, withFilters({ featured: true }));
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.every((e) => e.featured)).toBe(true);
  });
});

describe("sortEvents", () => {
  it("sorts by date or by lowest price without mutating the input", () => {
    const copy = [...EVENTS];
    const byDate = sortEvents(EVENTS, "date");
    const byPrice = sortEvents(EVENTS, "price");

    expect(EVENTS).toEqual(copy);
    for (let i = 1; i < byDate.length; i++) {
      expect(Date.parse(byDate[i].startsAt)).toBeGreaterThanOrEqual(Date.parse(byDate[i - 1].startsAt));
      expect(byPrice[i].minPrice).toBeGreaterThanOrEqual(byPrice[i - 1].minPrice);
    }
  });
});

describe("facets and chips", () => {
  it("counts events per category and city and lists months with events", () => {
    const counts = getFacetCounts(EVENTS);
    expect(counts.categories.concert).toBe(EVENTS.filter((e) => e.category === "concert").length);
    expect(counts.cities[0]).toEqual({ city: "Lima", count: EVENTS.filter((e) => e.city === "Lima").length });
    expect(counts.months).toContain("2026-11");
    expect([...counts.months].sort()).toEqual(counts.months);
  });

  it("builds removable chips with readable labels", () => {
    const filters = withFilters({
      q: "rock",
      categories: ["concert"],
      cities: ["Cusco"],
      month: "2026-11",
      price: "50-100",
    });
    const chips = getActiveFilterChips(filters);
    expect(chips.map((c) => c.label)).toEqual([
      "“rock”",
      "Conciertos",
      "Cusco",
      "Noviembre 2026",
      "S/ 50 a S/ 100",
    ]);

    const withoutConcert = removeFilterChip(filters, chips[1].key);
    expect(withoutConcert.categories).toEqual([]);
    expect(withoutConcert.q).toBe("rock");
  });

  it("formats month labels in Spanish", () => {
    expect(formatMonthLabel("2027-01")).toBe("Enero 2027");
  });
});
