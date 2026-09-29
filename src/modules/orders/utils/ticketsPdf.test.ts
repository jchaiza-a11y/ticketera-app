import { EVENTS } from "@/modules/events";
import type { Order } from "../store/order.store";
import { buildTicketsPdf, getTicketsPdfFileName } from "./ticketsPdf";

const event = EVENTS.find((e) => e.slug === "noches-de-verano-en-vivo")!;

const order: Order = {
  id: "TK-24817",
  eventSlug: event.slug,
  currency: "PEN",
  lines: [
    { zoneId: "general", zoneName: "Campo General", detail: "Entrada general", quantity: 1, amount: 215 },
    {
      zoneId: "west",
      zoneName: "Tribuna Occidente",
      detail: "Fila C · 5, 12",
      seatLabels: ["Fila C · 5", "Fila C · 12"],
      quantity: 2,
      amount: 360,
    },
  ],
  count: 3,
  total: 575,
  buyer: { fullName: "María Quispe", email: "maria@correo.pe" },
  payment: { method: "card", cardLast4: "1111" },
  createdAt: "2026-10-01T12:00:00.000Z",
};

// jsPDF writes text with PDF string escaping; parentheses and backslashes are the only escapes used here.
const pageText = (doc: ReturnType<typeof buildTicketsPdf>, page: number) =>
  (doc.internal.pages[page] as unknown as string[]).join("\n");

describe("buildTicketsPdf", () => {
  it("creates one page per ticket with order, ticket number, seat and holder", async () => {
    const doc = buildTicketsPdf(order, event);
    expect(doc.getNumberOfPages()).toBe(3);

    const third = pageText(doc, 3);
    expect(third).toContain("TK-24817");
    expect(third).toContain("Entrada 3 de 3");
    expect(third).toContain("Tribuna Occidente");
    expect(third).toContain(event.title);
    expect(third).toContain("María Quispe");
  });

  it("names the file after the order", () => {
    expect(getTicketsPdfFileName(order)).toBe("entradas-TK-24817.pdf");
  });
});
