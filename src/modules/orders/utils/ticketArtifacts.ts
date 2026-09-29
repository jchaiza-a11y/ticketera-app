import QRCode from "qrcode";
import type { Order } from "../store/order.store";

const EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

export interface OrderTicket {
  number: number;
  total: number;
  zoneName: string;
  detail: string;
}

export interface TicketQr {
  size: number;
  modules: boolean[];
}

interface CalendarEventInput {
  title: string;
  startsAt: string;
  venue: string;
  city: string;
  orderId: string;
}

export function expandTickets(order: Order): OrderTicket[] {
  const tickets = order.lines.flatMap((line) =>
    Array.from({ length: line.quantity }, (_, index) => ({
      zoneName: line.zoneName,
      detail: line.seatLabels?.[index] ?? line.detail,
    })),
  );
  return tickets.map((ticket, index) => ({ ...ticket, number: index + 1, total: tickets.length }));
}

// No backend validates it yet; the payload carries what a door scanner would need to look the ticket up.
export function buildTicketPayload(order: Order, ticket: OrderTicket): string {
  return [
    "TICKETERA",
    order.id,
    `${ticket.number}/${ticket.total}`,
    order.eventSlug,
    ticket.zoneName,
    ticket.detail,
  ].join("|");
}

export function buildTicketQr(payload: string): TicketQr {
  const { modules } = QRCode.create(payload, { errorCorrectionLevel: "M" });
  return {
    size: modules.size,
    modules: Array.from(modules.data, (cell) => cell === 1),
  };
}

const toIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const escapeIcsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

const getEventRange = (startsAt: string) => {
  const start = new Date(startsAt);
  return { start, end: new Date(start.getTime() + EVENT_DURATION_MS) };
};

const describeOrder = (orderId: string) =>
  `Pedido N.º ${orderId}. Muestra tu QR en el ingreso.`;

export function buildIcsEvent(event: CalendarEventInput, now: Date = new Date()): string {
  const { start, end } = getEventRange(event.startsAt);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ticketera//Entradas//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.orderId}@ticketera`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(`${event.venue}, ${event.city}`)}`,
    `DESCRIPTION:${escapeIcsText(describeOrder(event.orderId))}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

// A data URL on a real <a download> works in every browser; iOS Safari opens it in Calendar.
export function buildIcsDataUrl(event: CalendarEventInput, now: Date = new Date()): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildIcsEvent(event, now))}`;
}

export function buildGoogleCalendarUrl(event: CalendarEventInput): string {
  const { start, end } = getEventRange(event.startsAt);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toIcsDate(start)}/${toIcsDate(end)}`,
    location: `${event.venue}, ${event.city}`,
    details: describeOrder(event.orderId),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
