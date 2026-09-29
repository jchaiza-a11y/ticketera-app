import {
  MAX_TICKETS_PER_ORDER,
  type Seat,
  type VenueMap,
  type Zone,
} from "../schemas/seating.schema";

export interface SeatSelectionState {
  seatIds: string[];
  generalQuantities: Record<string, number>;
}

export type SeatSelectionAction =
  | { type: "toggleSeat"; seat: Seat; zone: Zone }
  | { type: "setGeneralQuantity"; zone: Zone; quantity: number }
  | { type: "clear" };

export interface SelectionLine {
  zoneId: string;
  zoneName: string;
  detail: string;
  // One label per seat ("Fila C · 12") so each ticket can carry its own seat.
  seatLabels?: string[];
  quantity: number;
  amount: number;
}

export interface SelectionSummary {
  lines: SelectionLine[];
  count: number;
  total: number;
}

export const INITIAL_SEAT_SELECTION: SeatSelectionState = {
  seatIds: [],
  generalQuantities: {},
};

export function getSelectionCount(state: SeatSelectionState): number {
  const general = Object.values(state.generalQuantities).reduce(
    (sum, quantity) => sum + quantity,
    0,
  );
  return state.seatIds.length + general;
}

function toggleSeat(
  state: SeatSelectionState,
  seat: Seat,
  zone: Zone,
): SeatSelectionState {
  if (state.seatIds.includes(seat.id)) {
    return { ...state, seatIds: state.seatIds.filter((id) => id !== seat.id) };
  }
  const blocked =
    seat.status === "occupied" ||
    zone.status === "sold-out" ||
    getSelectionCount(state) >= MAX_TICKETS_PER_ORDER;
  if (blocked) return state;
  return { ...state, seatIds: [...state.seatIds, seat.id] };
}

function setGeneralQuantity(
  state: SeatSelectionState,
  zone: Zone,
  quantity: number,
): SeatSelectionState {
  if (zone.kind !== "general" || zone.status === "sold-out") return state;

  const current = state.generalQuantities[zone.id] ?? 0;
  const available = MAX_TICKETS_PER_ORDER - (getSelectionCount(state) - current);
  const next = Math.max(0, Math.min(Math.trunc(quantity), available));

  const generalQuantities = { ...state.generalQuantities, [zone.id]: next };
  if (next === 0) delete generalQuantities[zone.id];
  return { ...state, generalQuantities };
}

export function seatSelectionReducer(
  state: SeatSelectionState,
  action: SeatSelectionAction,
): SeatSelectionState {
  switch (action.type) {
    case "toggleSeat":
      return toggleSeat(state, action.seat, action.zone);
    case "setGeneralQuantity":
      return setGeneralQuantity(state, action.zone, action.quantity);
    case "clear":
      return INITIAL_SEAT_SELECTION;
  }
}

const sortSeats = (seats: Seat[]) =>
  [...seats].sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number);

function describeSeats(seats: Seat[]): string {
  const byRow = new Map<string, number[]>();
  for (const seat of seats) {
    byRow.set(seat.row, [...(byRow.get(seat.row) ?? []), seat.number]);
  }
  return [...byRow.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, numbers]) => `Fila ${row} · ${numbers.sort((a, b) => a - b).join(", ")}`)
    .join(" · ");
}

export function getSelectionSummary(
  state: SeatSelectionState,
  venue: VenueMap,
): SelectionSummary {
  const selectedSeats = venue.seats.filter((seat) => state.seatIds.includes(seat.id));

  const lines = venue.zones.flatMap((zone): SelectionLine[] => {
    if (zone.kind === "general") {
      const quantity = state.generalQuantities[zone.id] ?? 0;
      if (quantity === 0) return [];
      return [
        {
          zoneId: zone.id,
          zoneName: zone.name,
          detail: "Entrada general",
          quantity,
          amount: quantity * zone.price,
        },
      ];
    }
    const seats = selectedSeats.filter((seat) => seat.zoneId === zone.id);
    if (seats.length === 0) return [];
    return [
      {
        zoneId: zone.id,
        zoneName: zone.name,
        detail: describeSeats(seats),
        seatLabels: sortSeats(seats).map((seat) => `Fila ${seat.row} · ${seat.number}`),
        quantity: seats.length,
        amount: seats.length * zone.price,
      },
    ];
  });

  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: lines.reduce((sum, line) => sum + line.amount, 0),
  };
}
