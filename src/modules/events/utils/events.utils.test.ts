import { describe, expect, it } from "vitest";
import { formatEventDate, formatPrice } from "./events.utils";

describe("formatPrice", () => {
  it("formats soles with symbol and two decimals", () => {
    expect(formatPrice(120, "PEN")).toBe("S/ 120.00");
  });

  it("adds thousands separators", () => {
    expect(formatPrice(1250.5, "PEN")).toBe("S/ 1,250.50");
  });

  it("formats dollars", () => {
    expect(formatPrice(45, "USD")).toBe("US$ 45.00");
  });
});

describe("formatEventDate", () => {
  it("formats in Spanish as weekday day month", () => {
    expect(formatEventDate("2026-11-15T20:00:00-05:00")).toBe("dom 15 nov");
  });

  it("uses Lima time regardless of the machine timezone", () => {
    expect(formatEventDate("2026-11-16T02:00:00Z")).toBe("dom 15 nov");
  });
});
