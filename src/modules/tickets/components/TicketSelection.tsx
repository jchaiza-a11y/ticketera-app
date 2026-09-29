"use client";

import { useReducer, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ChevronUp } from "lucide-react";
import { PurchaseSteps } from "@/components/shared/PurchaseSteps";
import { Card } from "@/components/ui/card";
import { formatEventDate, formatPrice, type Event } from "@/modules/events";
import { useOrderStore } from "@/modules/orders";
import {
  MAX_TICKETS_PER_ORDER,
  type Seat,
  type VenueMap,
  type Zone,
} from "../schemas/seating.schema";
import {
  getSelectionSummary,
  INITIAL_SEAT_SELECTION,
  seatSelectionReducer,
} from "../utils/seatSelection";
import { getZonePalette, SOLD_OUT_TONE } from "../utils/zonePalette";
import { SeatMap } from "./SeatMap";
import { CheckoutButton, countLabel, SelectionPanel, SummaryLines } from "./SelectionPanel";
import { ZoneMap } from "./ZoneMap";

interface TicketSelectionProps {
  event: Event;
  venue: VenueMap;
}

export function TicketSelection({ event, venue }: TicketSelectionProps) {
  const [selection, dispatch] = useReducer(seatSelectionReducer, INITIAL_SEAT_SELECTION);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [highlightedZoneId, setHighlightedZoneId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const palette = getZonePalette(venue.zones);
  const summary = getSelectionSummary(selection, venue);
  const activeZone = venue.zones.find((zone) => zone.id === activeZoneId) ?? null;
  const selectedSeats = venue.seats.filter((seat) => selection.seatIds.includes(seat.id));
  const counts = Object.fromEntries(
    venue.zones.map((zone) => [
      zone.id,
      zone.kind === "general"
        ? (selection.generalQuantities[zone.id] ?? 0)
        : selectedSeats.filter((seat) => seat.zoneId === zone.id).length,
    ]),
  );
  const eventHref = `/events/${event.slug}`;
  const checkoutHref = `${eventHref}/checkout`;
  const isEmpty = summary.count === 0;

  const startCheckout = () =>
    useOrderStore.getState().startCheckout(event.slug, event.currency, summary);

  const pickZone = (zone: Zone) => {
    setActiveZoneId(zone.id);
    if (zone.kind === "seated" && window.matchMedia("(max-width: 1023px)").matches) {
      mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const zoneOf = (seat: Seat) => venue.zones.find((zone) => zone.id === seat.zoneId)!;
  const toggleSeat = (seat: Seat) => dispatch({ type: "toggleSeat", seat, zone: zoneOf(seat) });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-36 pt-6 sm:px-6 md:pt-8 lg:px-8 lg:pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={eventHref}
          className="flex h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver al evento
        </Link>
        <PurchaseSteps current={1} />
      </div>

      <header className="mt-4 flex items-center gap-4">
        <Image
          src={event.imageUrl}
          alt=""
          width={64}
          height={64}
          className="size-14 shrink-0 rounded-2xl object-cover md:size-16"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{event.title}</h1>
          <p className="text-sm capitalize text-muted-foreground md:text-base">
            {formatEventDate(event.startsAt)} · {event.venue}, {event.city}
          </p>
        </div>
      </header>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <Card ref={mapRef} className="min-w-0 scroll-mt-36 gap-4 rounded-2xl p-4 md:p-6">
          <nav aria-label="Ubicación en el mapa" className="flex min-h-9 items-center gap-1.5 text-sm">
            {activeZone?.kind === "seated" ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveZoneId(null)}
                  className="flex h-9 items-center gap-1 rounded-lg px-2 font-medium text-primary hover:bg-accent"
                >
                  <ArrowLeft className="size-4" />
                  {venue.name}
                </button>
                <ChevronRight className="size-4 text-muted-foreground" />
                <span className="font-semibold">{activeZone.name}</span>
                <span className="ml-auto text-muted-foreground">
                  {formatPrice(activeZone.price, event.currency)} c/u
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold">{venue.name}</span>
                <span className="ml-auto hidden text-muted-foreground sm:inline">Toca una zona para empezar</span>
              </>
            )}
          </nav>

          {activeZone?.kind === "seated" ? (
            <SeatMap
              key={activeZone.id}
              zone={activeZone}
              tone={palette.get(activeZone.id) ?? SOLD_OUT_TONE}
              seats={venue.seats.filter((seat) => seat.zoneId === activeZone.id)}
              selectedSeatIds={selection.seatIds}
              canAddMore={summary.count < MAX_TICKETS_PER_ORDER}
              currency={event.currency}
              onToggleSeat={toggleSeat}
            />
          ) : (
            <ZoneMap
              venue={venue}
              palette={palette}
              currency={event.currency}
              activeZoneId={activeZoneId}
              highlightedZoneId={highlightedZoneId}
              counts={counts}
              onPick={pickZone}
              onHighlight={setHighlightedZoneId}
            />
          )}
        </Card>

        <aside aria-label="Tu compra" className="lg:sticky lg:top-36">
          <SelectionPanel
            zones={venue.zones}
            palette={palette}
            currency={event.currency}
            activeZoneId={activeZoneId}
            highlightedZoneId={highlightedZoneId}
            generalQuantities={selection.generalQuantities}
            selectedSeats={selectedSeats}
            summary={summary}
            checkoutHref={checkoutHref}
            onPickZone={pickZone}
            onHighlightZone={setHighlightedZoneId}
            onSetQuantity={(zone, quantity) => dispatch({ type: "setGeneralQuantity", zone, quantity })}
            onRemoveSeat={toggleSeat}
            onClear={() => dispatch({ type: "clear" })}
            onContinue={startCheckout}
          />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-md lg:hidden">
        {!isEmpty && (
          <details className="group border-b">
            <summary className="mx-auto flex h-11 w-full max-w-7xl cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium text-primary sm:px-6 [&::-webkit-details-marker]:hidden">
              Ver selección
              <ChevronUp className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mx-auto max-h-56 w-full max-w-7xl overflow-y-auto px-4 pb-3 sm:px-6">
              <SummaryLines summary={summary} currency={event.currency} />
            </div>
          </details>
        )}
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs text-muted-foreground">Total · {countLabel(summary.count)}</span>
            <span className="text-xl font-bold tabular-nums">
              {formatPrice(summary.total, event.currency)}
            </span>
          </div>
          <div className="ml-auto w-44">
            <CheckoutButton href={checkoutHref} disabled={isEmpty} onContinue={startCheckout} />
          </div>
        </div>
      </div>
    </div>
  );
}
