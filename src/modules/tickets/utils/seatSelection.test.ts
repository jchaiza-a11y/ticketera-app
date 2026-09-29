import { VENUE_MAP } from "../data/seating.mock";
import {
  MAX_TICKETS_PER_ORDER,
  venueMapSchema,
  type Seat,
  type Zone,
} from "../schemas/seating.schema";
import {
  getSelectionCount,
  getSelectionSummary,
  INITIAL_SEAT_SELECTION,
  seatSelectionReducer,
  type SeatSelectionState,
} from "./seatSelection";

const zone = (id: string): Zone => {
  const found = VENUE_MAP.zones.find((z) => z.id === id);
  if (!found) throw new Error(`zone ${id} not found`);
  return found;
};

const seatsOf = (zoneId: string, status: Seat["status"]) =>
  VENUE_MAP.seats.filter((s) => s.zoneId === zoneId && s.status === status);

const seat = (id: string): Seat => {
  const found = VENUE_MAP.seats.find((s) => s.id === id);
  if (!found) throw new Error(`seat ${id} not found`);
  return found;
};

const toggle = (state: SeatSelectionState, s: Seat) =>
  seatSelectionReducer(state, { type: "toggleSeat", seat: s, zone: zone(s.zoneId) });

describe("VENUE_MAP", () => {
  it("passes the schema with 2 general and 3 seated zones", () => {
    expect(() => venueMapSchema.parse(VENUE_MAP)).not.toThrow();
    expect(VENUE_MAP.zones).toHaveLength(5);
    expect(VENUE_MAP.zones.filter((z) => z.kind === "general")).toHaveLength(2);
    expect(VENUE_MAP.zones.filter((z) => z.kind === "seated")).toHaveLength(3);
  });

  it("gives every seated zone at least 150 seats with some occupied", () => {
    for (const z of VENUE_MAP.zones.filter((z) => z.kind === "seated")) {
      const seats = VENUE_MAP.seats.filter((s) => s.zoneId === z.id);
      expect(seats.length).toBeGreaterThanOrEqual(150);
      expect(seats.some((s) => s.status === "occupied")).toBe(true);
    }
  });

  it("has unique seat ids and only places seats in seated zones", () => {
    const ids = VENUE_MAP.seats.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const seatedIds = new Set(
      VENUE_MAP.zones.filter((z) => z.kind === "seated").map((z) => z.id),
    );
    expect(VENUE_MAP.seats.every((s) => seatedIds.has(s.zoneId))).toBe(true);
  });
});

describe("seatSelectionReducer", () => {
  it("selects and deselects an available seat", () => {
    const s = seatsOf("west", "available")[0];
    const selected = toggle(INITIAL_SEAT_SELECTION, s);
    expect(selected.seatIds).toEqual([s.id]);
    expect(toggle(selected, s).seatIds).toEqual([]);
  });

  it("ignores occupied seats", () => {
    const s = seatsOf("west", "occupied")[0];
    expect(toggle(INITIAL_SEAT_SELECTION, s)).toBe(INITIAL_SEAT_SELECTION);
  });

  it("ignores sold-out zones", () => {
    const state = seatSelectionReducer(INITIAL_SEAT_SELECTION, {
      type: "setGeneralQuantity",
      zone: zone("vip"),
      quantity: 2,
    });
    expect(state).toBe(INITIAL_SEAT_SELECTION);
  });

  it("never exceeds the order limit mixing seats and general tickets", () => {
    let state = seatSelectionReducer(INITIAL_SEAT_SELECTION, {
      type: "setGeneralQuantity",
      zone: zone("general"),
      quantity: 4,
    });
    const [a, b, c] = seatsOf("east", "available");
    state = toggle(toggle(toggle(state, a), b), c);

    expect(getSelectionCount(state)).toBe(MAX_TICKETS_PER_ORDER);
    expect(state.seatIds).toEqual([a.id, b.id]);

    const clamped = seatSelectionReducer(state, {
      type: "setGeneralQuantity",
      zone: zone("general"),
      quantity: 10,
    });
    expect(clamped.generalQuantities.general).toBe(4);
  });

  it("removes the general line when its quantity goes to 0", () => {
    const withTwo = seatSelectionReducer(INITIAL_SEAT_SELECTION, {
      type: "setGeneralQuantity",
      zone: zone("general"),
      quantity: 2,
    });
    const cleared = seatSelectionReducer(withTwo, {
      type: "setGeneralQuantity",
      zone: zone("general"),
      quantity: 0,
    });
    expect(cleared.generalQuantities).toEqual({});
    expect(getSelectionSummary(cleared, VENUE_MAP).lines).toEqual([]);
  });

  it("clears the whole selection", () => {
    const state = toggle(INITIAL_SEAT_SELECTION, seatsOf("north", "available")[0]);
    expect(seatSelectionReducer(state, { type: "clear" })).toEqual(
      INITIAL_SEAT_SELECTION,
    );
  });
});

describe("getSelectionSummary", () => {
  it("builds lines, count and total", () => {
    let state = seatSelectionReducer(INITIAL_SEAT_SELECTION, {
      type: "setGeneralQuantity",
      zone: zone("general"),
      quantity: 2,
    });
    state = toggle(state, seat("west-C-12"));

    expect(getSelectionSummary(state, VENUE_MAP)).toEqual({
      lines: [
        {
          zoneId: "general",
          zoneName: "Campo General",
          detail: "Entrada general",
          quantity: 2,
          amount: 900,
        },
        {
          zoneId: "west",
          zoneName: "Tribuna Occidente",
          detail: "Fila C · 12",
          quantity: 1,
          amount: 380,
        },
      ],
      count: 3,
      total: 1280,
    });
  });

  it("lists seats of a zone sorted by row and number", () => {
    let state = toggle(INITIAL_SEAT_SELECTION, seat("west-D-4"));
    state = toggle(state, seat("west-C-12"));
    state = toggle(state, seat("west-C-5"));

    const [line] = getSelectionSummary(state, VENUE_MAP).lines;
    expect(line.detail).toBe("Fila C · 5, 12 · Fila D · 4");
    expect(line.amount).toBe(380 * 3);
  });
});
