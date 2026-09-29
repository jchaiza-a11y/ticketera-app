import type { Zone } from "../schemas/seating.schema";
import { getPriceLegend, getZonePalette, SOLD_OUT_TONE, ZONE_TONES } from "./zonePalette";

const zone = (id: string, price: number, status: Zone["status"] = "available"): Zone => ({
  id,
  name: id,
  price,
  kind: "seated",
  status,
  shape: { x: 0, y: 0, width: 10, height: 10 },
});

const zones = [
  zone("vip", 690, "sold-out"),
  zone("general", 450),
  zone("west", 380, "low-stock"),
  zone("east", 320),
  zone("north", 250),
];

describe("getZonePalette", () => {
  it("gives the most intense tone to the most expensive available zone", () => {
    const palette = getZonePalette(zones);
    expect(palette.get("general")).toBe(ZONE_TONES[0]);
    expect(palette.get("west")).toBe(ZONE_TONES[1]);
    expect(palette.get("east")).toBe(ZONE_TONES[2]);
    expect(palette.get("north")).toBe(ZONE_TONES[3]);
  });

  it("paints sold-out zones grey", () => {
    expect(getZonePalette(zones).get("vip")).toBe(SOLD_OUT_TONE);
  });

  it("shares a tone between zones with the same price", () => {
    const palette = getZonePalette([zone("a", 100), zone("b", 100), zone("c", 50)]);
    expect(palette.get("a")).toBe(palette.get("b"));
    expect(palette.get("c")).toBe(ZONE_TONES[1]);
  });
});

describe("getPriceLegend", () => {
  it("lists price levels from cheapest to most expensive, then sold out", () => {
    const legend = getPriceLegend(zones, "PEN");
    expect(legend.map((item) => item.label)).toEqual([
      "S/ 250.00",
      "S/ 320.00",
      "S/ 380.00",
      "S/ 450.00",
      "Agotado",
    ]);
    expect(legend[0].swatch).toBe(ZONE_TONES[3].swatch);
    expect(legend.at(-1)?.swatch).toBe(SOLD_OUT_TONE.swatch);
  });
});
