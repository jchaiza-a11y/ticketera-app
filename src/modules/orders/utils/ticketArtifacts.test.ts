import { buildIcsEvent, buildQrPattern, QR_SIZE } from "./ticketArtifacts";

const FINDER_ORIGINS = [
  [0, 0],
  [0, QR_SIZE - 7],
  [QR_SIZE - 7, 0],
];

const finderCells = (pattern: boolean[]) =>
  FINDER_ORIGINS.flatMap(([row, col]) =>
    Array.from({ length: 49 }, (_, i) => pattern[(row + Math.floor(i / 7)) * QR_SIZE + col + (i % 7)]),
  );

describe("buildQrPattern", () => {
  it("returns a 21×21 grid that is stable per seed", () => {
    const pattern = buildQrPattern("TK-24817-1");
    expect(pattern).toHaveLength(441);
    expect(buildQrPattern("TK-24817-1")).toEqual(pattern);
  });

  it("changes with the seed but keeps the three finder marks", () => {
    const a = buildQrPattern("TK-24817-1");
    const b = buildQrPattern("TK-24817-2");
    expect(a).not.toEqual(b);
    expect(finderCells(a)).toEqual(finderCells(b));
    // Finder mark: dark outer ring, light inner ring, dark 3×3 core.
    expect(a[0]).toBe(true);
    expect(a[1 * QR_SIZE + 1]).toBe(false);
    expect(a[3 * QR_SIZE + 3]).toBe(true);
  });
});

describe("buildIcsEvent", () => {
  const ics = buildIcsEvent(
    {
      title: "Noches de Verano en Vivo",
      startsAt: "2026-11-15T20:00:00-05:00",
      venue: "Arena Costa Verde",
      city: "Lima",
      orderId: "TK-24817",
    },
    new Date(Date.UTC(2026, 9, 1, 12, 0, 0)),
  );

  it("builds a VEVENT with UTC times and a 3 hour duration", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT\r\n");
    expect(ics).toContain("DTSTART:20261116T010000Z\r\n");
    expect(ics).toContain("DTEND:20261116T040000Z\r\n");
    expect(ics).toContain("DTSTAMP:20261001T120000Z\r\n");
    expect(ics).toContain("UID:TK-24817@ticketera\r\n");
    expect(ics).toContain("SUMMARY:Noches de Verano en Vivo\r\n");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("escapes commas and semicolons in text fields", () => {
    expect(ics).toContain("LOCATION:Arena Costa Verde\\, Lima\r\n");
    const tricky = buildIcsEvent({
      title: "Rock; Pop, y más",
      startsAt: "2026-11-15T20:00:00-05:00",
      venue: "V",
      city: "C",
      orderId: "TK-1",
    });
    expect(tricky).toContain("SUMMARY:Rock\\; Pop\\, y más\r\n");
  });

  it("uses CRLF line endings only", () => {
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });
});
