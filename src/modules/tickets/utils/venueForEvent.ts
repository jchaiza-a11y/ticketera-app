import type { Event } from "@/modules/events";
import { VENUE_MAP } from "../data/seating.mock";
import type { VenueMap } from "../schemas/seating.schema";

const PRICE_STEP = 5;

// Every event uses the mock stadium layout, priced so its cheapest zone matches the card's "Desde".
export function getVenueMapForEvent(event: Event, base: VenueMap = VENUE_MAP): VenueMap {
  const basePrices = base.zones.map((zone) => zone.price);
  const baseMin = Math.min(...basePrices);
  const factor = event.minPrice / baseMin;

  return {
    ...base,
    name: event.venue,
    zones: base.zones.map((zone) => ({
      ...zone,
      price:
        zone.price === baseMin
          ? event.minPrice
          : Math.max(
              event.minPrice + PRICE_STEP,
              Math.round((zone.price * factor) / PRICE_STEP) * PRICE_STEP,
            ),
      status: event.badge === "sold-out" ? "sold-out" : zone.status,
    })),
  };
}
