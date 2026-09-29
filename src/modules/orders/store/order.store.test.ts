import type { SelectionSummary } from "@/modules/tickets";
import { CHECKOUT_HOLD_MS, useOrderStore } from "./order.store";

const summary: SelectionSummary = {
  lines: [
    { zoneId: "general", zoneName: "Campo General", detail: "Entrada general", quantity: 2, amount: 900 },
    { zoneId: "west", zoneName: "Tribuna Occidente", detail: "Fila C · 12", quantity: 1, amount: 380 },
  ],
  count: 3,
  total: 1280,
};

const buyer = {
  fullName: "María Quispe",
  email: "maria@correo.pe",
  documentType: "DNI" as const,
  documentNumber: "45678912",
  phone: "987654321",
};

const NOW = Date.UTC(2026, 9, 1, 15, 0, 0);

beforeEach(() => {
  useOrderStore.setState({ draft: null, lastOrder: null });
});

describe("useOrderStore", () => {
  it("starts a checkout draft that expires in 10 minutes", () => {
    useOrderStore.getState().startCheckout("noches-de-verano-en-vivo", "PEN", summary, NOW);

    expect(useOrderStore.getState().draft).toEqual({
      eventSlug: "noches-de-verano-en-vivo",
      currency: "PEN",
      summary,
      expiresAt: NOW + CHECKOUT_HOLD_MS,
    });
    expect(CHECKOUT_HOLD_MS).toBe(10 * 60 * 1000);
  });

  it("places an order from the draft and clears the draft", () => {
    const store = useOrderStore.getState();
    store.startCheckout("noches-de-verano-en-vivo", "PEN", summary, NOW);

    const order = useOrderStore.getState().placeOrder(
      buyer,
      { method: "card", cardNumber: "4111111111111111", expiry: "12/40", cvv: "123", cardName: "MARIA" },
      NOW,
    );

    expect(order?.id).toMatch(/^TK-\d{5}$/);
    expect(order).toMatchObject({
      eventSlug: "noches-de-verano-en-vivo",
      currency: "PEN",
      lines: summary.lines,
      count: 3,
      total: 1280,
      buyer: { fullName: "María Quispe", email: "maria@correo.pe" },
      payment: { method: "card", cardLast4: "1111" },
      createdAt: new Date(NOW).toISOString(),
    });
    expect(useOrderStore.getState().draft).toBeNull();
    expect(useOrderStore.getState().lastOrder).toEqual(order);
  });

  it("never keeps the full card number or the CVV", () => {
    useOrderStore.getState().startCheckout("x", "PEN", summary, NOW);
    useOrderStore.getState().placeOrder(
      buyer,
      { method: "card", cardNumber: "4111111111111111", expiry: "12/40", cvv: "987", cardName: "MARIA" },
      NOW,
    );

    const persisted = JSON.stringify(useOrderStore.getState());
    expect(persisted).not.toContain("4111111111111111");
    expect(persisted).not.toContain("987");
    expect(persisted).not.toContain("45678912");
  });

  it("keeps no card data for Yape and refuses to place an order without a draft", () => {
    expect(useOrderStore.getState().placeOrder(buyer, { method: "yape" }, NOW)).toBeNull();

    useOrderStore.getState().startCheckout("x", "PEN", summary, NOW);
    const order = useOrderStore.getState().placeOrder(buyer, { method: "yape" }, NOW);
    expect(order?.payment).toEqual({ method: "yape" });
  });

  it("clears the draft on demand", () => {
    useOrderStore.getState().startCheckout("x", "PEN", summary, NOW);
    useOrderStore.getState().clearDraft();
    expect(useOrderStore.getState().draft).toBeNull();
  });
});
