import { jsPDF } from "jspdf";
import {
  EVENT_CATEGORY_LABELS,
  formatEventLongDate,
  formatEventTime,
  type Event,
} from "@/modules/events";
import type { Order } from "../store/order.store";
import {
  buildTicketPayload,
  buildTicketQr,
  expandTickets,
  type OrderTicket,
} from "./ticketArtifacts";

// Brand tokens from globals.css, converted to RGB because jsPDF does not read CSS variables.
const INK: [number, number, number] = [27, 27, 47];
const MUTED: [number, number, number] = [107, 107, 133];
const PRIMARY: [number, number, number] = [77, 66, 225];
const BORDER: [number, number, number] = [228, 227, 239];

const PAGE_WIDTH = 210;
const MARGIN = 18;
const QR_SIZE_MM = 58;

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function drawQr(doc: jsPDF, payload: string, x: number, y: number, size: number) {
  const qr = buildTicketQr(payload);
  const cell = size / qr.size;
  doc.setFillColor(...INK);
  qr.modules.forEach((dark, index) => {
    if (!dark) return;
    const col = index % qr.size;
    const row = Math.floor(index / qr.size);
    // A hair of overlap avoids white seams between cells in some PDF viewers.
    doc.rect(x + col * cell, y + row * cell, cell + 0.05, cell + 0.05, "F");
  });
}

function drawLabelValue(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED);
  doc.text(label, x, y);
  doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(...INK);
  doc.text(value, x, y + 6);
}

function drawTicketPage(doc: jsPDF, order: Order, event: Event, ticket: OrderTicket) {
  const contentWidth = PAGE_WIDTH - MARGIN * 2;

  doc.setFillColor(...PRIMARY).rect(0, 0, PAGE_WIDTH, 26, "F");
  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(255, 255, 255);
  doc.text("Ticketera", MARGIN, 16);
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Entrada ${ticket.number} de ${ticket.total}`, PAGE_WIDTH - MARGIN, 16, { align: "right" });

  let y = 42;
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...PRIMARY);
  doc.text(EVENT_CATEGORY_LABELS[event.category].toUpperCase(), MARGIN, y);

  y += 9;
  doc.setFontSize(22).setTextColor(...INK);
  const titleLines = doc.splitTextToSize(event.title, contentWidth) as string[];
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 9 + 2;

  doc.setFont("helvetica", "normal").setFontSize(12).setTextColor(...MUTED);
  doc.text(
    `${capitalize(formatEventLongDate(event.startsAt))} · ${formatEventTime(event.startsAt)}`,
    MARGIN,
    y,
  );
  doc.text(`${event.venue}, ${event.city}`, MARGIN, y + 7);

  y += 18;
  doc.setDrawColor(...BORDER).setLineWidth(0.4).roundedRect(MARGIN, y, contentWidth, 84, 4, 4, "S");

  const qrX = PAGE_WIDTH - MARGIN - QR_SIZE_MM - 10;
  drawQr(doc, buildTicketPayload(order, ticket), qrX, y + 13, QR_SIZE_MM);

  const colX = MARGIN + 10;
  drawLabelValue(doc, "Zona", ticket.zoneName, colX, y + 16);
  drawLabelValue(doc, "Ubicación", ticket.detail, colX, y + 34);
  drawLabelValue(doc, "Titular", order.buyer.fullName, colX, y + 52);
  drawLabelValue(doc, "Pedido", order.id, colX, y + 70);

  y += 96;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED);
  doc.text(
    doc.splitTextToSize(
      "Presenta este código QR desde tu celular o impreso en el ingreso. Cada entrada tiene un código único y solo se puede usar una vez.",
      contentWidth,
    ) as string[],
    MARGIN,
    y,
  );
}

export function buildTicketsPdf(order: Order, event: Event): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setProperties({ title: `Entradas ${order.id} · ${event.title}`, author: "Ticketera" });

  expandTickets(order).forEach((ticket, index) => {
    if (index > 0) doc.addPage();
    drawTicketPage(doc, order, event, ticket);
  });
  return doc;
}

export const getTicketsPdfFileName = (order: Order) => `entradas-${order.id}.pdf`;
