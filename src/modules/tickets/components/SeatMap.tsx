"use client";

import type { KeyboardEvent } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/modules/events";
import type { Seat, Zone } from "../schemas/seating.schema";

const SEAT_RADIUS = 9;
const PADDING = 48;
const STAGE_HEIGHT = 30;
const FULL_SIZE = { width: "100%", height: "100%" };

const LEGEND = [
  { label: "Disponible", className: "border-primary/60 bg-primary/25" },
  { label: "Seleccionado", className: "border-primary bg-primary" },
  { label: "Ocupado", className: "border-transparent bg-muted-foreground/30" },
];

interface SeatMapProps {
  zone: Zone;
  seats: Seat[];
  selectedSeatIds: string[];
  canAddMore: boolean;
  currency: string;
  onToggleSeat: (seat: Seat) => void;
}

function getBounds(seats: Seat[]) {
  const xs = seats.map((seat) => seat.x);
  const ys = seats.map((seat) => seat.y);
  const minX = Math.min(...xs) - PADDING;
  const minY = Math.min(...ys) - PADDING - STAGE_HEIGHT;
  return {
    minX,
    minY,
    width: Math.max(...xs) + PADDING - minX,
    height: Math.max(...ys) + PADDING - minY,
  };
}

function getRowEnds(seats: Seat[]) {
  const rows = new Map<string, { first: Seat; last: Seat }>();
  for (const seat of seats) {
    const ends = rows.get(seat.row);
    if (!ends) rows.set(seat.row, { first: seat, last: seat });
    else if (seat.number > ends.last.number) ends.last = seat;
  }
  return [...rows.entries()];
}

export function SeatMap({
  zone,
  seats,
  selectedSeatIds,
  canAddMore,
  currency,
  onToggleSeat,
}: SeatMapProps) {
  const bounds = getBounds(seats);
  const price = formatPrice(zone.price, currency);

  return (
    <div className="flex flex-col gap-3">
      <TransformWrapper
        minScale={1}
        maxScale={4}
        doubleClick={{ disabled: true }}
        wheel={{ step: 0.2 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div className="relative h-[360px] overflow-hidden rounded-xl bg-muted/60 md:h-[440px]">
            <TransformComponent wrapperStyle={FULL_SIZE} contentStyle={FULL_SIZE}>
              <svg
                viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
                className="size-full touch-none select-none"
                role="group"
                aria-label={`Butacas de ${zone.name}`}
              >
                <rect
                  x={bounds.minX + bounds.width * 0.25}
                  y={bounds.minY + 8}
                  width={bounds.width * 0.5}
                  height={STAGE_HEIGHT}
                  rx={8}
                  className="fill-foreground"
                />
                <text
                  x={bounds.minX + bounds.width / 2}
                  y={bounds.minY + 8 + STAGE_HEIGHT / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-background text-[13px] font-semibold tracking-widest"
                >
                  HACIA EL ESCENARIO
                </text>

                {getRowEnds(seats).map(([row, { first, last }]) => (
                  <g
                    key={row}
                    aria-hidden="true"
                    className="fill-muted-foreground text-[13px] font-semibold"
                  >
                    <text x={first.x - 24} y={first.y} textAnchor="middle" dominantBaseline="central">
                      {row}
                    </text>
                    <text x={last.x + 24} y={last.y} textAnchor="middle" dominantBaseline="central">
                      {row}
                    </text>
                  </g>
                ))}

                {seats.map((seat) => {
                  const selected = selectedSeatIds.includes(seat.id);
                  const occupied = seat.status === "occupied";
                  const disabled = occupied || (!selected && !canAddMore);
                  const toggle = () => {
                    if (!disabled || selected) onToggleSeat(seat);
                  };
                  const onKeyDown = (event: KeyboardEvent) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    toggle();
                  };

                  return (
                    <g
                      key={seat.id}
                      role="button"
                      tabIndex={occupied ? -1 : 0}
                      aria-pressed={selected}
                      aria-disabled={disabled}
                      aria-label={`Fila ${seat.row}, asiento ${seat.number}, ${occupied ? "ocupado" : price}`}
                      onClick={toggle}
                      onKeyDown={onKeyDown}
                      className={cn(
                        "outline-none [&:focus-visible>circle]:stroke-foreground [&:focus-visible>circle]:stroke-[3]",
                        disabled ? "cursor-not-allowed" : "cursor-pointer",
                      )}
                    >
                      <circle
                        cx={seat.x}
                        cy={seat.y}
                        r={SEAT_RADIUS}
                        className={cn(
                          "transition-colors duration-200",
                          selected && "fill-primary stroke-primary stroke-2",
                          !selected && occupied && "fill-muted-foreground/30",
                          !selected && !occupied && canAddMore &&
                            "fill-primary/25 stroke-primary/60 hover:fill-primary/50",
                          !selected && !occupied && !canAddMore &&
                            "fill-primary/10 stroke-primary/25",
                        )}
                      />
                    </g>
                  );
                })}
              </svg>
            </TransformComponent>

            <div className="absolute bottom-2 right-2 flex gap-1.5">
              <Button variant="outline" className="size-11" aria-label="Acercar" onClick={() => zoomIn()}>
                <Plus />
              </Button>
              <Button variant="outline" className="size-11" aria-label="Alejar" onClick={() => zoomOut()}>
                <Minus />
              </Button>
              <Button
                variant="outline"
                className="size-11"
                aria-label="Restablecer vista"
                onClick={() => resetTransform()}
              >
                <RotateCcw />
              </Button>
            </div>
          </div>
        )}
      </TransformWrapper>

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className={cn("size-3.5 rounded-full border", item.className)} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
