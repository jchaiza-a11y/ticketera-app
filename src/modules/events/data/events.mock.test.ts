import { describe, expect, it } from "vitest";
import { EVENT_CATEGORIES } from "../schemas/events.schema";
import { EVENTS } from "./events.mock";

describe("EVENTS mock", () => {
  it.each(EVENT_CATEGORIES)("has at least one event in %s", (category) => {
    expect(EVENTS.some((event) => event.category === category)).toBe(true);
  });
});
