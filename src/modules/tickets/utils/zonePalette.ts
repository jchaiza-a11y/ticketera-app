import { formatPrice } from "@/modules/events";
import type { Zone } from "../schemas/seating.schema";

export interface ZoneTone {
  fill: string;
  text: string;
  swatch: string;
  seat: string;
  seatSwatch: string;
}

// Full class names (not built dynamically) so Tailwind can find them.
export const ZONE_TONES: ZoneTone[] = [
  { fill: "fill-primary", text: "fill-primary-foreground", swatch: "bg-primary", seat: "fill-primary/70", seatSwatch: "bg-primary/70" },
  { fill: "fill-primary/80", text: "fill-primary-foreground", swatch: "bg-primary/80", seat: "fill-primary/60", seatSwatch: "bg-primary/60" },
  { fill: "fill-primary/60", text: "fill-primary-foreground", swatch: "bg-primary/60", seat: "fill-primary/50", seatSwatch: "bg-primary/50" },
  { fill: "fill-primary/40", text: "fill-foreground", swatch: "bg-primary/40", seat: "fill-primary/40", seatSwatch: "bg-primary/40" },
  { fill: "fill-primary/25", text: "fill-foreground", swatch: "bg-primary/25", seat: "fill-primary/30", seatSwatch: "bg-primary/30" },
];

export const SOLD_OUT_TONE: ZoneTone = {
  fill: "fill-muted-foreground/15",
  text: "fill-muted-foreground",
  swatch: "bg-muted-foreground/25",
  seat: "fill-muted-foreground/25",
  seatSwatch: "bg-muted-foreground/25",
};

export interface LegendItem {
  id: string;
  label: string;
  swatch: string;
}

const getPriceLevels = (zones: Zone[]) =>
  [...new Set(zones.filter((z) => z.status !== "sold-out").map((z) => z.price))].sort(
    (a, b) => b - a,
  );

export function getZonePalette(zones: Zone[]): Map<string, ZoneTone> {
  const levels = getPriceLevels(zones);
  return new Map(
    zones.map((zone) => [
      zone.id,
      zone.status === "sold-out"
        ? SOLD_OUT_TONE
        : ZONE_TONES[Math.min(levels.indexOf(zone.price), ZONE_TONES.length - 1)],
    ]),
  );
}

export function getPriceLegend(zones: Zone[], currency: string): LegendItem[] {
  const levels = getPriceLevels(zones);
  const items = [...levels].reverse().map((price) => ({
    id: String(price),
    label: formatPrice(price, currency),
    swatch: ZONE_TONES[Math.min(levels.indexOf(price), ZONE_TONES.length - 1)].swatch,
  }));
  return zones.some((z) => z.status === "sold-out")
    ? [...items, { id: "sold-out", label: "Agotado", swatch: SOLD_OUT_TONE.swatch }]
    : items;
}
