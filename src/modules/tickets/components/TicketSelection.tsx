"use client";

import { useReducer, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PurchaseSteps } from "@/components/shared/PurchaseSteps";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatEventDate, formatPrice, type Event } from "@/modules/events";
import { useOrderStore } from "@/modules/orders";
import {
  MAX_TICKETS_PER_ORDER,
  type VenueMap,
  type Zone,
} from "../schemas/seating.schema";
import {
  getSelectionSummary,
  INITIAL_SEAT_SELECTION,
  seatSelectionReducer,
  type SelectionSummary,
} from "../utils/seatSelection";
import { SeatMap } from "./SeatMap";

const ZONE_TONES = [
  { fill: "fill-primary", text: "fill-primary-foreground", swatch: "bg-primary" },
  { fill: "fill-primary/75", text: "fill-primary-foreground", swatch: "bg-primary/75" },
  { fill: "fill-primary/50", text: "fill-foreground", swatch: "bg-primary/50" },
  { fill: "fill-primary/30", text: "fill-foreground", swatch: "bg-primary/30" },
];
const SOLD_OUT_TONE = {
  fill: "fill-muted-foreground/20",
  text: "fill-muted-foreground",
  swatch: "bg-muted-foreground/30",
};

const STATUS_BADGES = {
  "low-stock": { label: "Últimas entradas", className: "bg-warning text-foreground" },
  "sold-out": { label: "Agotado", className: "bg-destructive text-white" },
} as const;

const CTA_CLASS = "h-12 w-full gap-2 rounded-xl text-base";

function getZoneTones(zones: Zone[]) {
  let index = 0;
  return new Map(
    zones.map((zone) => [
      zone.id,
      zone.status === "sold-out" ? SOLD_OUT_TONE : ZONE_TONES[index++ % ZONE_TONES.length],
    ]),
  );
}

const countLabel = (count: number) => (count === 1 ? "1 entrada" : `${count} entradas`);

interface QuantityStepperProps {
  label: string;
  value: number;
  canIncrease: boolean;
  onChange: (value: number) => void;
}

function QuantityStepper({ label, value, canIncrease, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border p-0.5">
      <Button
        variant="secondary"
        className="size-11 rounded-lg"
        aria-label={`Quitar una entrada de ${label}`}
        disabled={value === 0}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>
      <span aria-live="polite" className="w-8 text-center text-base font-semibold tabular-nums">
        {value}
      </span>
      <Button
        className="size-11 rounded-lg"
        aria-label={`Agregar una entrada de ${label}`}
        disabled={!canIncrease}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </div>
  );
}

interface ZoneOverviewProps {
  venue: VenueMap;
  tones: ReturnType<typeof getZoneTones>;
  activeZoneId: string | null;
  currency: string;
  onPick: (zone: Zone) => void;
}

function ZoneOverview({ venue, tones, activeZoneId, currency, onPick }: ZoneOverviewProps) {
  const { stage } = venue;

  return (
    <svg
      viewBox={`0 0 ${venue.viewBox.width} ${venue.viewBox.height}`}
      className="w-full rounded-xl bg-muted/60"
      role="group"
      aria-label={`Mapa de zonas de ${venue.name}`}
    >
      <rect {...stage} rx={14} className="fill-foreground" />
      <text
        x={stage.x + stage.width / 2}
        y={stage.y + stage.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-background text-[30px] font-bold tracking-[0.2em]"
      >
        ESCENARIO
      </text>

      {venue.zones.map((zone) => {
        const tone = tones.get(zone.id) ?? SOLD_OUT_TONE;
        const soldOut = zone.status === "sold-out";
        const selected = zone.id === activeZoneId;
        const { x, y, width, height } = zone.shape;
        const words = height > width ? zone.name.split(" ") : [zone.name];
        const caption = soldOut ? "Agotado" : formatPrice(zone.price, currency);
        const lineHeight = 46;
        const top = y + height / 2 - (words.length * lineHeight) / 2;
        const onKeyDown = (event: KeyboardEvent) => {
          if (soldOut || (event.key !== "Enter" && event.key !== " ")) return;
          event.preventDefault();
          onPick(zone);
        };

        return (
          <g
            key={zone.id}
            role="button"
            tabIndex={soldOut ? -1 : 0}
            aria-pressed={selected}
            aria-disabled={soldOut}
            aria-label={`${zone.name}, ${caption}`}
            onClick={() => !soldOut && onPick(zone)}
            onKeyDown={onKeyDown}
            className={cn(
              "outline-none [&:focus-visible>rect]:stroke-ring [&:focus-visible>rect]:stroke-[6]",
              soldOut ? "cursor-not-allowed" : "cursor-pointer [&:hover>rect]:opacity-85",
            )}
          >
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              rx={18}
              className={cn(
                tone.fill,
                "transition-all duration-200",
                selected && "stroke-foreground stroke-[6]",
              )}
            />
            <text textAnchor="middle" className={cn(tone.text, "pointer-events-none")}>
              {words.map((word, index) => (
                <tspan
                  key={word}
                  x={x + width / 2}
                  y={top + index * lineHeight}
                  className="text-[40px] font-semibold"
                >
                  {word}
                </tspan>
              ))}
              <tspan
                x={x + width / 2}
                y={top + words.length * lineHeight + 4}
                className="text-[32px]"
              >
                {caption}
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
  );
}

interface OrderSummaryProps {
  summary: SelectionSummary;
  currency: string;
  checkoutHref: string;
  onClear: () => void;
  onContinue: () => void;
}

function OrderSummary({
  summary,
  currency,
  checkoutHref,
  onClear,
  onContinue,
}: OrderSummaryProps) {
  const isEmpty = summary.count === 0;

  return (
    <Card className="gap-5 rounded-2xl p-6 shadow-md">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Tu compra</h2>
        {!isEmpty && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-primary hover:underline"
          >
            Vaciar
          </button>
        )}
      </div>

      {isEmpty ? (
        <p className="rounded-xl border-2 border-dashed p-5 text-center text-sm leading-relaxed text-muted-foreground">
          Todavía no elegiste entradas. Toca una zona del mapa para empezar.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {summary.lines.map((line) => (
            <li key={line.zoneId} className="flex justify-between gap-3 text-sm">
              <span className="flex flex-col">
                <span className="font-medium">
                  {line.quantity} × {line.zoneName}
                </span>
                <span className="text-muted-foreground">{line.detail}</span>
              </span>
              <span className="font-semibold tabular-nums">
                {formatPrice(line.amount, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-baseline justify-between border-t-2 border-dashed pt-4">
        <span className="font-medium">
          Total <span className="font-normal text-muted-foreground">({countLabel(summary.count)})</span>
        </span>
        <span className="text-2xl font-bold tracking-tight tabular-nums">
          {formatPrice(summary.total, currency)}
        </span>
      </div>

      <CheckoutButton href={checkoutHref} disabled={isEmpty} onContinue={onContinue} />
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" />
        Compra segura · Máximo {MAX_TICKETS_PER_ORDER} entradas por compra
      </p>
    </Card>
  );
}

interface CheckoutButtonProps {
  href: string;
  disabled: boolean;
  onContinue: () => void;
}

function CheckoutButton({ href, disabled, onContinue }: CheckoutButtonProps) {
  if (disabled) {
    return (
      <Button variant="cta" disabled className={CTA_CLASS}>
        Continuar
      </Button>
    );
  }
  return (
    <Button
      variant="cta"
      className={CTA_CLASS}
      nativeButton={false}
      render={<Link href={href} onClick={onContinue} />}
    >
      Continuar
      <ArrowRight className="size-5" />
    </Button>
  );
}

interface TicketSelectionProps {
  event: Event;
  venue: VenueMap;
}

export function TicketSelection({ event, venue }: TicketSelectionProps) {
  const [selection, dispatch] = useReducer(seatSelectionReducer, INITIAL_SEAT_SELECTION);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const tones = getZoneTones(venue.zones);
  const summary = getSelectionSummary(selection, venue);
  const canAddMore = summary.count < MAX_TICKETS_PER_ORDER;
  const activeZone = venue.zones.find((zone) => zone.id === activeZoneId) ?? null;
  const eventHref = `/events/${event.slug}`;
  const checkoutHref = `${eventHref}/checkout`;
  const startCheckout = () =>
    useOrderStore.getState().startCheckout(event.slug, event.currency, summary);

  const pickZone = (zone: Zone) => {
    setActiveZoneId(zone.id);
    if (zone.kind === "seated") {
      mapRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  };

  const setQuantity = (zone: Zone, quantity: number) => {
    setActiveZoneId(zone.id);
    dispatch({ type: "setGeneralQuantity", zone, quantity });
  };

  const renderGeneralControl = (zone: Zone) => (
    <QuantityStepper
      label={zone.name}
      value={selection.generalQuantities[zone.id] ?? 0}
      canIncrease={canAddMore}
      onChange={(quantity) => setQuantity(zone, quantity)}
    />
  );

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

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-6">
          <Card ref={mapRef} className="scroll-mt-36 gap-4 rounded-2xl p-4 md:p-6">
            {activeZone?.kind === "seated" ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    className="h-11 gap-1.5 px-2"
                    onClick={() => setActiveZoneId(null)}
                  >
                    <ArrowLeft />
                    Todas las zonas
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{activeZone.name}</span> ·{" "}
                    {formatPrice(activeZone.price, event.currency)} c/u
                  </p>
                </div>
                <SeatMap
                  zone={activeZone}
                  seats={venue.seats.filter((seat) => seat.zoneId === activeZone.id)}
                  selectedSeatIds={selection.seatIds}
                  canAddMore={canAddMore}
                  currency={event.currency}
                  onToggleSeat={(seat) =>
                    dispatch({ type: "toggleSeat", seat, zone: activeZone })
                  }
                />
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-xl font-semibold">Elige tu zona</h2>
                  <span className="text-sm text-muted-foreground">Toca una zona del mapa</span>
                </div>
                <ZoneOverview
                  venue={venue}
                  tones={tones}
                  activeZoneId={activeZoneId}
                  currency={event.currency}
                  onPick={pickZone}
                />
                {activeZone?.kind === "general" && (
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-accent p-3 pl-4">
                    <span className="flex flex-col">
                      <span className="font-semibold">{activeZone.name}</span>
                      <span className="text-sm text-muted-foreground">
                        Sin numerar · {formatPrice(activeZone.price, event.currency)} c/u
                      </span>
                    </span>
                    {renderGeneralControl(activeZone)}
                  </div>
                )}
              </>
            )}
            {!canAddMore && (
              <p role="status" className="text-sm font-medium text-muted-foreground">
                Llegaste al máximo de {MAX_TICKETS_PER_ORDER} entradas por compra.
              </p>
            )}
          </Card>

          <Card className="gap-0 rounded-2xl px-4 py-2 md:px-6">
            <h2 className="py-3 text-xl font-semibold">Entradas</h2>
            <ul>
              {venue.zones.map((zone) => {
                const tone = tones.get(zone.id) ?? SOLD_OUT_TONE;
                const badge = zone.status === "available" ? null : STATUS_BADGES[zone.status];
                const seatCount = selection.seatIds.filter((id) =>
                  venue.seats.some((seat) => seat.id === id && seat.zoneId === zone.id),
                ).length;

                return (
                  <li
                    key={zone.id}
                    className={cn(
                      "-mx-2 flex min-h-19 flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border-t px-2 py-3 transition-colors",
                      zone.id === activeZoneId && "bg-accent",
                    )}
                  >
                    <span className={cn("size-3.5 shrink-0 rounded", tone.swatch)} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex flex-wrap items-center gap-2 font-semibold">
                        {zone.name}
                        {badge && zone.status !== "sold-out" && (
                          <Badge className={badge.className}>{badge.label}</Badge>
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(zone.price, event.currency)} c/u ·{" "}
                        {zone.kind === "seated" ? "Numerada" : "Sin numerar"}
                      </span>
                    </span>
                    {zone.status === "sold-out" ? (
                      <Badge className={STATUS_BADGES["sold-out"].className}>Agotado</Badge>
                    ) : zone.kind === "general" ? (
                      renderGeneralControl(zone)
                    ) : (
                      <Button
                        variant={seatCount > 0 ? "secondary" : "outline"}
                        className="h-11 px-4"
                        onClick={() => pickZone(zone)}
                      >
                        {seatCount > 0 ? `${countLabel(seatCount)} · Cambiar` : "Elegir asientos"}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <aside aria-label="Resumen de la compra" className="hidden lg:sticky lg:top-36 lg:block">
          <OrderSummary
            summary={summary}
            currency={event.currency}
            checkoutHref={checkoutHref}
            onClear={() => dispatch({ type: "clear" })}
            onContinue={startCheckout}
          />
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs text-muted-foreground">
              Total · {countLabel(summary.count)}
            </span>
            <span className="text-xl font-bold tabular-nums">
              {formatPrice(summary.total, event.currency)}
            </span>
          </div>
          <div className="ml-auto w-44">
            <CheckoutButton
              href={checkoutHref}
              disabled={summary.count === 0}
              onContinue={startCheckout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
