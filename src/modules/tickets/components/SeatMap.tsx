"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Maximize, Minus, Plus } from "lucide-react";
import { MiniMap, TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/modules/events";
import type { Seat, Zone } from "../schemas/seating.schema";
import type { ZoneTone } from "../utils/zonePalette";
import { getTooltipPosition, MapTooltip, type TooltipPosition } from "./MapTooltip";

const PADDING = 44;
const STAGE_SPACE = 70;
const FULL_SIZE = { width: "100%", height: "100%" };

interface SeatMapProps {
  zone: Zone;
  tone: ZoneTone;
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
  const minY = Math.min(...ys) - PADDING - STAGE_SPACE;
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

// Backrest + seat cushion, centred on (0, 0) and ~20×18 units.
function SeatGlyph({ className, fill }: { className?: string; fill?: string }) {
  return (
    <>
      <rect x={-8} y={-10} width={16} height={8} rx={3} className={className} fill={fill} />
      <rect x={-10} y={-1} width={20} height={10} rx={3.5} className={className} fill={fill} />
    </>
  );
}

type SeatState = "selected" | "available" | "occupied" | "blocked";

export function SeatMap({
  zone,
  tone,
  seats,
  selectedSeatIds,
  canAddMore,
  currency,
  onToggleSeat,
}: SeatMapProps) {
  const hatchId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ seat: Seat; state: SeatState; position: TooltipPosition } | null>(null);
  const bounds = getBounds(seats);
  const price = formatPrice(zone.price, currency);
  const viewBox = `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`;
  const stageY = bounds.minY + 18;
  const stageLeft = bounds.minX + bounds.width * 0.18;
  const stageRight = bounds.minX + bounds.width * 0.82;

  const seatState = (seat: Seat): SeatState => {
    if (selectedSeatIds.includes(seat.id)) return "selected";
    if (seat.status === "occupied") return "occupied";
    return canAddMore ? "available" : "blocked";
  };

  const legend = [
    { label: "Disponible", className: tone.seatSwatch },
    { label: "Tu selección", className: "bg-primary" },
    { label: "Ocupado", className: "bg-muted-foreground/30" },
  ];

  return (
    <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
      <TransformWrapper minScale={1} maxScale={5} doubleClick={{ disabled: true }} wheel={{ step: 0.2 }}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <div
            ref={frameRef}
            className="relative h-[380px] overflow-hidden rounded-2xl bg-muted/70 md:h-[460px]"
            onMouseLeave={() => setTooltip(null)}
          >
            <TransformComponent wrapperStyle={FULL_SIZE} contentStyle={FULL_SIZE}>
              <svg
                viewBox={viewBox}
                className="size-full touch-none select-none"
                role="group"
                aria-label={`Butacas de ${zone.name}`}
              >
                <defs>
                  <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="5" height="5" className="fill-muted-foreground/20" />
                    <path d="M0 0v5" className="stroke-muted-foreground/35" strokeWidth="2" />
                  </pattern>
                </defs>

                <path
                  d={`M ${stageLeft} ${stageY + 34} Q ${(stageLeft + stageRight) / 2} ${stageY - 10} ${stageRight} ${stageY + 34}`}
                  className="fill-none stroke-foreground"
                  strokeWidth={10}
                  strokeLinecap="round"
                />
                <text
                  x={(stageLeft + stageRight) / 2}
                  y={stageY + 32}
                  textAnchor="middle"
                  className="fill-foreground text-[13px] font-bold tracking-[0.3em]"
                >
                  ESCENARIO
                </text>

                {getRowEnds(seats).map(([row, { first, last }]) => (
                  <g key={row} aria-hidden="true" className="fill-muted-foreground text-[12px] font-semibold">
                    <text x={first.x - 22} y={first.y} textAnchor="middle" dominantBaseline="central">
                      {row}
                    </text>
                    <text x={last.x + 22} y={last.y} textAnchor="middle" dominantBaseline="central">
                      {row}
                    </text>
                  </g>
                ))}

                {seats.map((seat) => {
                  const state = seatState(seat);
                  const disabled = state === "occupied" || state === "blocked";
                  const toggle = () => {
                    if (!disabled) onToggleSeat(seat);
                  };
                  const onKeyDown = (event: KeyboardEvent) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    toggle();
                  };
                  const show = (target: Element) => {
                    const position = getTooltipPosition(target, frameRef.current);
                    if (position) setTooltip({ seat, state, position });
                  };

                  return (
                    <g
                      key={seat.id}
                      transform={`translate(${seat.x} ${seat.y})`}
                      role="button"
                      tabIndex={state === "occupied" ? -1 : 0}
                      aria-pressed={state === "selected"}
                      aria-disabled={disabled}
                      aria-label={`Fila ${seat.row}, asiento ${seat.number}, ${state === "occupied" ? "ocupado" : price}`}
                      onClick={toggle}
                      onKeyDown={onKeyDown}
                      onMouseEnter={(event) => show(event.currentTarget)}
                      onFocus={(event) => show(event.currentTarget)}
                      onBlur={() => setTooltip(null)}
                      className={cn(
                        "group outline-none",
                        disabled ? "cursor-not-allowed" : "cursor-pointer",
                      )}
                    >
                      <g
                        className={cn(
                          "origin-center transition-transform duration-150 [transform-box:fill-box]",
                          !disabled && "group-hover:scale-125 group-focus-visible:scale-125",
                          "group-focus-visible:[&>rect]:stroke-foreground group-focus-visible:[&>rect]:stroke-[2.5]",
                        )}
                      >
                        {state === "occupied" ? (
                          <SeatGlyph fill={`url(#${hatchId})`} />
                        ) : (
                          <SeatGlyph
                            className={cn(
                              "transition-colors duration-150",
                              state === "selected" && "fill-primary",
                              state === "available" && cn(tone.seat, "group-hover:fill-primary/80"),
                              state === "blocked" && "fill-muted-foreground/15",
                            )}
                          />
                        )}
                        {state === "selected" && (
                          <path
                            d="M-4.5 3.5 l3 3 l6 -6.5"
                            className="fill-none stroke-primary-foreground"
                            strokeWidth={2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        )}
                      </g>
                    </g>
                  );
                })}
              </svg>
            </TransformComponent>

            {tooltip && (
              <MapTooltip position={tooltip.position}>
                <p className="font-semibold">
                  Fila {tooltip.seat.row} · Asiento {tooltip.seat.number}
                </p>
                <p className="text-background/75">
                  {tooltip.state === "occupied"
                    ? "Ocupado"
                    : tooltip.state === "selected"
                      ? `${price} · Toca para quitar`
                      : tooltip.state === "blocked"
                        ? "Llegaste al máximo de entradas"
                        : `${price} · Disponible`}
                </p>
              </MapTooltip>
            )}

            <div className="absolute left-3 top-3 hidden overflow-hidden rounded-lg border bg-card/90 shadow-sm md:block">
              <MiniMap width={140} borderColor="var(--primary)">
                <svg viewBox={viewBox} className="block bg-card">
                  {seats.map((seat) => (
                    <rect
                      key={seat.id}
                      x={seat.x - 9}
                      y={seat.y - 9}
                      width={18}
                      height={17}
                      rx={3}
                      className={
                        selectedSeatIds.includes(seat.id)
                          ? "fill-primary"
                          : seat.status === "occupied"
                            ? "fill-muted-foreground/25"
                            : tone.seat
                      }
                    />
                  ))}
                </svg>
              </MiniMap>
            </div>

            <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
              <Button variant="ghost" className="size-11 rounded-none" aria-label="Acercar" onClick={() => zoomIn()}>
                <Plus />
              </Button>
              <Button variant="ghost" className="size-11 rounded-none border-y" aria-label="Alejar" onClick={() => zoomOut()}>
                <Minus />
              </Button>
              <Button variant="ghost" className="size-11 rounded-none" aria-label="Encuadrar" onClick={() => resetTransform()}>
                <Maximize />
              </Button>
            </div>
          </div>
        )}
      </TransformWrapper>

      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {legend.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <span className={cn("h-3 w-3.5 rounded-[4px]", item.className)} />
            {item.label}
          </li>
        ))}
        <li className="sm:ml-auto">Pellizca o usa + / − para acercar</li>
      </ul>
    </div>
  );
}
