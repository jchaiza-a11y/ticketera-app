import type { Order } from "../store/order.store";
import {
  buildGoogleCalendarUrl,
  buildIcsDataUrl,
  buildIcsEvent,
  buildTicketPayload,
  buildTicketQr,
  expandTickets,
} from "./ticketArtifacts";

const order: Order = {
  id: "TK-24817",
  eventSlug: "noches-de-verano-en-vivo",
  currency: "PEN",
  lines: [
    { zoneId: "general", zoneName: "Campo General", detail: "Entrada general", quantity: 2, amount: 430 },
    {
      zoneId: "west",
      zoneName: "Tribuna Occidente",
      detail: "Fila C · 5, 12",
      seatLabels: ["Fila C · 5", "Fila C · 12"],
      quantity: 2,
      amount: 360,
    },
  ],
  count: 4,
  total: 790,
  buyer: { fullName: "María Quispe", email: "maria@correo.pe" },
  payment: { method: "yape" },
  createdAt: "2026-10-01T12:00:00.000Z",
};

const calendarInput = {
  title: "Noches de Verano en Vivo",
  startsAt: "2026-11-15T20:00:00-05:00",
  venue: "Arena Costa Verde",
  city: "Lima",
  orderId: "TK-24817",
};

describe("expandTickets", () => {
  it("creates one ticket per entry with its own seat", () => {
    const tickets = expandTickets(order);
    expect(tickets.map((t) => [t.number, t.total, t.zoneName, t.detail])).toEqual([
      [1, 4, "Campo General", "Entrada general"],
      [2, 4, "Campo General", "Entrada general"],
      [3, 4, "Tribuna Occidente", "Fila C · 5"],
      [4, 4, "Tribuna Occidente", "Fila C · 12"],
    ]);
  });
});

describe("buildTicketPayload and buildTicketQr", () => {
  const [first, second, third] = expandTickets(order);

  it("encodes order, ticket number, event, zone and seat", () => {
    expect(buildTicketPayload(order, third)).toBe(
      "TICKETERA|TK-24817|3/4|noches-de-verano-en-vivo|Tribuna Occidente|Fila C · 5",
    );
  });

  it("builds a square QR matrix that differs per ticket", () => {
    const a = buildTicketQr(buildTicketPayload(order, first));
    const b = buildTicketQr(buildTicketPayload(order, second));
    expect(a.size).toBeGreaterThanOrEqual(21);
    expect(a.modules).toHaveLength(a.size * a.size);
    expect(a.modules).not.toEqual(b.modules);
    // Top-left finder pattern: dark corner, light ring, dark core.
    expect(a.modules[0]).toBe(true);
    expect(a.modules[1 * a.size + 1]).toBe(false);
    expect(a.modules[3 * a.size + 3]).toBe(true);
  });
});

describe("buildIcsEvent", () => {
  const ics = buildIcsEvent(calendarInput, new Date(Date.UTC(2026, 9, 1, 12, 0, 0)));

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
    const tricky = buildIcsEvent({ ...calendarInput, title: "Rock; Pop, y más" });
    expect(tricky).toContain("SUMMARY:Rock\\; Pop\\, y más\r\n");
  });

  it("uses CRLF line endings only", () => {
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });
});

describe("calendar links", () => {
  it("builds a data URL that decodes to the .ics file", () => {
    const now = new Date(Date.UTC(2026, 9, 1, 12, 0, 0));
    const url = buildIcsDataUrl(calendarInput, now);
    const prefix = "data:text/calendar;charset=utf-8,";
    expect(url.startsWith(prefix)).toBe(true);
    expect(decodeURIComponent(url.slice(prefix.length))).toBe(buildIcsEvent(calendarInput, now));
  });

  it("builds a prefilled Google Calendar link", () => {
    const url = new URL(buildGoogleCalendarUrl(calendarInput));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("Noches de Verano en Vivo");
    expect(url.searchParams.get("dates")).toBe("20261116T010000Z/20261116T040000Z");
    expect(url.searchParams.get("location")).toBe("Arena Costa Verde, Lima");
    expect(url.searchParams.get("details")).toContain("TK-24817");
  });
});
