import { venueMapSchema, type Seat } from "../schemas/seating.schema";

const ROWS = "ABCDEFGHIJKL";
const SEATS_PER_ROW = 20;
const SEAT_SPACING = 24;
const ROW_SPACING = 28;
const ROW_CURVE = 0.2;
// Aisles after seats 5 and 15 split every row into 5 | 10 | 5 blocks.
export const AISLES_AFTER = [5, 15];
const AISLE_WIDTH = 22;

// Deterministic pattern instead of Math.random so SSR and client render the same map.
const isOccupied = (rowIndex: number, number: number) =>
  ((rowIndex + 1) * 31 + number * 17) % 7 < 2;

function buildSeatedZone(zoneId: string): Seat[] {
  const center = (SEATS_PER_ROW + 1) / 2;
  return [...ROWS].flatMap((row, rowIndex) =>
    Array.from({ length: SEATS_PER_ROW }, (_, i) => {
      const number = i + 1;
      const offset = number - center;
      const aisles = AISLES_AFTER.filter((after) => number > after).length;
      return {
        id: `${zoneId}-${row}-${number}`,
        zoneId,
        row,
        number,
        x: offset * SEAT_SPACING + (aisles - AISLES_AFTER.length / 2) * AISLE_WIDTH,
        y: rowIndex * ROW_SPACING + ROW_CURVE * offset * offset,
        status: isOccupied(rowIndex, number) ? "occupied" : "available",
      } satisfies Seat;
    }),
  );
}

export const VENUE_MAP = venueMapSchema.parse({
  name: "Estadio Nacional",
  viewBox: { width: 1000, height: 740 },
  stage: { x: 300, y: 20, width: 400, height: 64 },
  zones: [
    {
      id: "vip",
      name: "Campo VIP",
      price: 690,
      kind: "general",
      status: "sold-out",
      shape: { x: 300, y: 100, width: 400, height: 150 },
    },
    {
      id: "general",
      name: "Campo General",
      price: 450,
      kind: "general",
      status: "available",
      shape: { x: 300, y: 266, width: 400, height: 234 },
    },
    {
      id: "west",
      name: "Tribuna Occidente",
      price: 380,
      kind: "seated",
      status: "low-stock",
      shape: { x: 40, y: 20, width: 244, height: 480 },
    },
    {
      id: "east",
      name: "Tribuna Oriente",
      price: 320,
      kind: "seated",
      status: "available",
      shape: { x: 716, y: 20, width: 244, height: 480 },
    },
    {
      id: "north",
      name: "Tribuna Norte",
      price: 250,
      kind: "seated",
      status: "available",
      shape: { x: 40, y: 516, width: 920, height: 204 },
    },
  ],
  seats: ["west", "east", "north"].flatMap(buildSeatedZone),
});
