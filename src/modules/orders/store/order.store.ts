"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SelectionLine, SelectionSummary } from "@/modules/tickets";
import type { Buyer, Payment, PaymentMethod } from "../schemas/checkout.schema";

export const CHECKOUT_HOLD_MS = 10 * 60 * 1000;

export interface OrderDraft {
  eventSlug: string;
  currency: string;
  summary: SelectionSummary;
  expiresAt: number;
}

export interface Order {
  id: string;
  eventSlug: string;
  currency: string;
  lines: SelectionLine[];
  count: number;
  total: number;
  buyer: Pick<Buyer, "fullName" | "email">;
  payment: { method: PaymentMethod; cardLast4?: string };
  createdAt: string;
}

interface OrderState {
  draft: OrderDraft | null;
  lastOrder: Order | null;
  startCheckout: (
    eventSlug: string,
    currency: string,
    summary: SelectionSummary,
    now?: number,
  ) => void;
  placeOrder: (buyer: Buyer, payment: Payment, now?: number) => Order | null;
  clearDraft: () => void;
}

const generateOrderId = () => `TK-${Math.floor(10000 + Math.random() * 90000)}`;

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      draft: null,
      lastOrder: null,

      startCheckout: (eventSlug, currency, summary, now = Date.now()) =>
        set({ draft: { eventSlug, currency, summary, expiresAt: now + CHECKOUT_HOLD_MS } }),

      placeOrder: (buyer, payment, now = Date.now()) => {
        const { draft } = get();
        if (!draft) return null;

        // Only what the confirmation screen shows is kept: never the card number, CVV or document.
        const order: Order = {
          id: generateOrderId(),
          eventSlug: draft.eventSlug,
          currency: draft.currency,
          lines: draft.summary.lines,
          count: draft.summary.count,
          total: draft.summary.total,
          buyer: { fullName: buyer.fullName, email: buyer.email },
          payment:
            payment.method === "card"
              ? { method: "card", cardLast4: payment.cardNumber.slice(-4) }
              : { method: payment.method },
          createdAt: new Date(now).toISOString(),
        };
        set({ draft: null, lastOrder: order });
        return order;
      },

      clearDraft: () => set({ draft: null }),
    }),
    {
      name: "ticketera-order",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ draft, lastOrder }) => ({ draft, lastOrder }),
    },
  ),
);

// sessionStorage does not exist during SSR; components wait for this before reading the store.
export function useOrderHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useOrderStore.persist.onFinishHydration(onChange),
    () => useOrderStore.persist.hasHydrated(),
    () => false,
  );
}
