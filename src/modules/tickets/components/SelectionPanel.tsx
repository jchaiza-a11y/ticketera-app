"use client";

import Link from "next/link";
import { ArrowRight, Hand, Lock, Minus, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/modules/events";
import { MAX_TICKETS_PER_ORDER, type Seat, type Zone } from "../schemas/seating.schema";
import type { SelectionSummary } from "../utils/seatSelection";
import { SOLD_OUT_TONE, type ZoneTone } from "../utils/zonePalette";

const STATUS_BADGES = {
  "low-stock": { label: "Últimas", className: "bg-warning text-foreground" },
  "sold-out": { label: "Agotado", className: "bg-destructive text-white" },
} as const;

export const countLabel = (count: number) => (count === 1 ? "1 entrada" : `${count} entradas`);

interface QuantityStepperProps {
  label: string;
  value: number;
  canIncrease: boolean;
  onChange: (value: number) => void;
}

function QuantityStepper({ label, value, canIncrease, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border bg-card p-0.5">
      <Button
        variant="secondary"
        className="size-11 rounded-lg"
        aria-label={`Quitar una entrada de ${label}`}
        disabled={value === 0}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>
      <span aria-live="polite" className="w-9 text-center text-lg font-semibold tabular-nums">
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

function StepTitle({ number, children }: { number: number; children: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold">
      <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-background">
        {number}
      </span>
      {children}
    </h3>
  );
}

interface CheckoutButtonProps {
  href: string;
  disabled: boolean;
  onContinue: () => void;
  className?: string;
}

export function CheckoutButton({ href, disabled, onContinue, className }: CheckoutButtonProps) {
  const classes = cn("h-12 w-full gap-2 rounded-xl text-base", className);
  if (disabled) {
    return (
      <Button variant="cta" disabled className={classes}>
        Continuar
      </Button>
    );
  }
  return (
    <Button
      variant="cta"
      className={classes}
      nativeButton={false}
      render={<Link href={href} onClick={onContinue} />}
    >
      Continuar
      <ArrowRight className="size-5" />
    </Button>
  );
}

export function SummaryLines({ summary, currency }: { summary: SelectionSummary; currency: string }) {
  return (
    <ul className="flex flex-col gap-3">
      {summary.lines.map((line) => (
        <li key={line.zoneId} className="flex justify-between gap-3 text-sm">
          <span className="flex flex-col">
            <span className="font-medium">
              {line.quantity} × {line.zoneName}
            </span>
            <span className="text-muted-foreground">{line.detail}</span>
          </span>
          <span className="font-semibold tabular-nums">{formatPrice(line.amount, currency)}</span>
        </li>
      ))}
    </ul>
  );
}

interface SelectionPanelProps {
  zones: Zone[];
  palette: Map<string, ZoneTone>;
  currency: string;
  activeZoneId: string | null;
  highlightedZoneId: string | null;
  generalQuantities: Record<string, number>;
  selectedSeats: Seat[];
  summary: SelectionSummary;
  checkoutHref: string;
  onPickZone: (zone: Zone) => void;
  onHighlightZone: (zoneId: string | null) => void;
  onSetQuantity: (zone: Zone, quantity: number) => void;
  onRemoveSeat: (seat: Seat) => void;
  onClear: () => void;
  onContinue: () => void;
}

export function SelectionPanel({
  zones,
  palette,
  currency,
  activeZoneId,
  highlightedZoneId,
  generalQuantities,
  selectedSeats,
  summary,
  checkoutHref,
  onPickZone,
  onHighlightZone,
  onSetQuantity,
  onRemoveSeat,
  onClear,
  onContinue,
}: SelectionPanelProps) {
  const activeZone = zones.find((zone) => zone.id === activeZoneId) ?? null;
  const canAddMore = summary.count < MAX_TICKETS_PER_ORDER;
  const isEmpty = summary.count === 0;
  const zoneCount = (zone: Zone) =>
    zone.kind === "general"
      ? (generalQuantities[zone.id] ?? 0)
      : selectedSeats.filter((seat) => seat.zoneId === zone.id).length;
  const activeSeats = selectedSeats.filter((seat) => seat.zoneId === activeZoneId);

  return (
    <Card className="gap-6 rounded-2xl p-5 shadow-md md:p-6">
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

      <section className="flex flex-col gap-3">
        <StepTitle number={1}>Elige una zona</StepTitle>
        <ul className="flex flex-col gap-2" onMouseLeave={() => onHighlightZone(null)}>
          {zones.map((zone) => {
            const tone = palette.get(zone.id) ?? SOLD_OUT_TONE;
            const soldOut = zone.status === "sold-out";
            const active = zone.id === activeZoneId;
            const highlighted = zone.id === highlightedZoneId;
            const badge = zone.status === "available" ? null : STATUS_BADGES[zone.status];
            const count = zoneCount(zone);

            return (
              <li key={zone.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={soldOut}
                  onClick={() => onPickZone(zone)}
                  onMouseEnter={() => onHighlightZone(zone.id)}
                  onFocus={() => onHighlightZone(zone.id)}
                  onBlur={() => onHighlightZone(null)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-3 py-2 text-left transition-colors",
                    active ? "border-primary bg-accent" : "border-transparent bg-muted/60",
                    highlighted && !active && "border-primary/40",
                    soldOut ? "cursor-not-allowed opacity-60" : "hover:border-primary/40",
                  )}
                >
                  <span className={cn("size-4 shrink-0 rounded-md", tone.swatch)} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                      {zone.name}
                      {badge && <Badge className={badge.className}>{badge.label}</Badge>}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {zone.kind === "seated" ? "Numerada · eliges tu asiento" : "General · sin numerar"}
                    </span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatPrice(zone.price, currency)}
                    </span>
                    {count > 0 && (
                      <span className="text-xs font-medium text-primary">{countLabel(count)}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {activeZone && (
        <section className="flex flex-col gap-3">
          <StepTitle number={2}>
            {activeZone.kind === "general" ? "¿Cuántas entradas?" : "Elige tus asientos"}
          </StepTitle>
          {activeZone.kind === "general" ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-accent p-3 pl-4">
              <span className="flex flex-col text-sm">
                <span className="font-semibold">{activeZone.name}</span>
                <span className="text-muted-foreground">
                  {formatPrice(activeZone.price, currency)} c/u
                </span>
              </span>
              <QuantityStepper
                label={activeZone.name}
                value={generalQuantities[activeZone.id] ?? 0}
                canIncrease={canAddMore}
                onChange={(quantity) => onSetQuantity(activeZone, quantity)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl bg-accent p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Hand className="size-4 text-primary" />
                Toca los asientos en el mapa
              </p>
              {activeSeats.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {activeSeats.map((seat) => {
                    const label = `Fila ${seat.row} · ${seat.number}`;
                    return (
                      <li key={seat.id}>
                        <button
                          type="button"
                          aria-label={`Quitar ${label}`}
                          onClick={() => onRemoveSeat(seat)}
                          className="flex h-9 items-center gap-1.5 rounded-full bg-primary pl-3 pr-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
                        >
                          {label}
                          <X className="size-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {formatPrice(activeZone.price, currency)} por asiento. Puedes elegir hasta{" "}
                  {MAX_TICKETS_PER_ORDER}.
                </p>
              )}
            </div>
          )}
          {!canAddMore && (
            <p role="status" className="text-sm font-medium text-muted-foreground">
              Llegaste al máximo de {MAX_TICKETS_PER_ORDER} entradas por compra.
            </p>
          )}
        </section>
      )}

      <section className="hidden flex-col gap-4 border-t-2 border-dashed pt-5 lg:flex">
        {isEmpty ? (
          <p className="text-center text-sm text-muted-foreground">
            Aún no elegiste entradas.
          </p>
        ) : (
          <SummaryLines summary={summary} currency={currency} />
        )}
        <div className="flex items-baseline justify-between">
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
          Compra segura · Máximo {MAX_TICKETS_PER_ORDER} entradas
        </p>
      </section>
    </Card>
  );
}
