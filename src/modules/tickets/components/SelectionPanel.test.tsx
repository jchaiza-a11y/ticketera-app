import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VENUE_MAP } from "../data/seating.mock";
import type { Seat } from "../schemas/seating.schema";
import {
  getSelectionSummary,
  INITIAL_SEAT_SELECTION,
  type SeatSelectionState,
} from "../utils/seatSelection";
import { getZonePalette } from "../utils/zonePalette";
import { SelectionPanel } from "./SelectionPanel";

const seat = (id: string): Seat => VENUE_MAP.seats.find((s) => s.id === id)!;

function renderPanel(activeZoneId: string | null, selection: SeatSelectionState = INITIAL_SEAT_SELECTION) {
  const handlers = {
    onPickZone: vi.fn(),
    onHighlightZone: vi.fn(),
    onSetQuantity: vi.fn(),
    onRemoveSeat: vi.fn(),
    onClear: vi.fn(),
    onContinue: vi.fn(),
  };
  render(
    <SelectionPanel
      zones={VENUE_MAP.zones}
      palette={getZonePalette(VENUE_MAP.zones)}
      currency="PEN"
      activeZoneId={activeZoneId}
      highlightedZoneId={null}
      generalQuantities={selection.generalQuantities}
      selectedSeats={selection.seatIds.map(seat)}
      summary={getSelectionSummary(selection, VENUE_MAP)}
      checkoutHref="/events/x/checkout"
      {...handlers}
    />,
  );
  return handlers;
}

describe("SelectionPanel", () => {
  it("lists every zone and reports picks", async () => {
    const { onPickZone } = renderPanel(null);
    await userEvent.click(screen.getByRole("button", { name: /Tribuna Occidente/ }));
    expect(onPickZone).toHaveBeenCalledWith(expect.objectContaining({ id: "west" }));
    expect(screen.getByRole("button", { name: /Campo VIP/ })).toBeDisabled();
  });

  it("shows a single quantity stepper for a general zone", async () => {
    const { onSetQuantity } = renderPanel("general");
    const add = screen.getAllByRole("button", { name: "Agregar una entrada de Campo General" });
    expect(add).toHaveLength(1);
    await userEvent.click(add[0]);
    expect(onSetQuantity).toHaveBeenCalledWith(expect.objectContaining({ id: "general" }), 1);
  });

  it("asks to tap the map for a seated zone and lists removable seat chips", async () => {
    const { onRemoveSeat } = renderPanel("west", {
      ...INITIAL_SEAT_SELECTION,
      seatIds: ["west-C-12", "west-C-5"],
    });
    expect(screen.getByText("Toca los asientos en el mapa")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Agregar una entrada/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Quitar Fila C · 12" }));
    expect(onRemoveSeat).toHaveBeenCalledWith(seat("west-C-12"));
  });

  it("disables Continuar until there are tickets", () => {
    renderPanel(null);
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
  });

  it("enables Continuar and shows the total once tickets are chosen", () => {
    renderPanel("general", { ...INITIAL_SEAT_SELECTION, generalQuantities: { general: 2 } });
    expect(screen.getByRole("button", { name: /Continuar/ })).not.toBeDisabled();
    expect(screen.getAllByText("S/ 900.00").length).toBeGreaterThan(0);
  });
});
