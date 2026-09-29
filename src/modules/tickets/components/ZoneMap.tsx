"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/modules/events";
import type { VenueMap, Zone } from "../schemas/seating.schema";
import { getPriceLegend, SOLD_OUT_TONE, type ZoneTone } from "../utils/zonePalette";
import { getTooltipPosition, MapTooltip, type TooltipPosition } from "./MapTooltip";

const STATUS_TEXT: Record<Zone["status"], string> = {
  available: "Disponible",
  "low-stock": "Quedan pocas",
  "sold-out": "Agotado",
};

const LINE_HEIGHT = 46;

interface ZoneMapProps {
  venue: VenueMap;
  palette: Map<string, ZoneTone>;
  currency: string;
  activeZoneId: string | null;
  highlightedZoneId: string | null;
  counts: Record<string, number>;
  onPick: (zone: Zone) => void;
  onHighlight: (zoneId: string | null) => void;
}

export function ZoneMap({
  venue,
  palette,
  currency,
  activeZoneId,
  highlightedZoneId,
  counts,
  onPick,
  onHighlight,
}: ZoneMapProps) {
  const patternId = useId();
  const frameRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ zone: Zone; position: TooltipPosition } | null>(null);
  const { stage, viewBox } = venue;
  const legend = getPriceLegend(venue.zones, currency);

  const showTooltip = (zone: Zone, target: Element) => {
    const position = getTooltipPosition(target, frameRef.current);
    if (position) setTooltip({ zone, position });
    onHighlight(zone.id);
  };

  const hideTooltip = () => {
    setTooltip(null);
    onHighlight(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div ref={frameRef} className="relative">
        <svg
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
          className="w-full rounded-2xl bg-muted/70"
          role="group"
          aria-label={`Mapa de zonas de ${venue.name}`}
        >
          <defs>
            <pattern id={`${patternId}-rows`} width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M0 11h12" className="stroke-white/35" strokeWidth="2" />
            </pattern>
            <pattern id={`${patternId}-floor`} width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="1.8" className="fill-white/35" />
            </pattern>
          </defs>

          <rect
            x={stage.x}
            y={stage.y}
            width={stage.width}
            height={stage.height}
            rx={14}
            className="fill-foreground"
          />
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
            const tone = palette.get(zone.id) ?? SOLD_OUT_TONE;
            const soldOut = zone.status === "sold-out";
            const active = zone.id === activeZoneId;
            const highlighted = zone.id === highlightedZoneId;
            const dimmed = Boolean(highlightedZoneId) && !highlighted && !active;
            const { x, y, width, height } = zone.shape;
            const words = height > width ? zone.name.split(" ") : [zone.name];
            const caption = soldOut ? "Agotado" : formatPrice(zone.price, currency);
            const top = y + height / 2 - (words.length * LINE_HEIGHT) / 2;
            const count = counts[zone.id] ?? 0;
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
                aria-pressed={active}
                aria-disabled={soldOut}
                aria-label={`${zone.name}, ${caption}${count ? `, ${count} elegidas` : ""}`}
                onClick={() => !soldOut && onPick(zone)}
                onKeyDown={onKeyDown}
                onMouseEnter={(event) => showTooltip(zone, event.currentTarget)}
                onMouseLeave={hideTooltip}
                onFocus={(event) => showTooltip(zone, event.currentTarget)}
                onBlur={hideTooltip}
                className={cn(
                  "outline-none transition-opacity duration-200 [&:focus-visible>rect:first-child]:stroke-ring [&:focus-visible>rect:first-child]:stroke-[8]",
                  soldOut ? "cursor-not-allowed" : "cursor-pointer",
                  dimmed && "opacity-55",
                )}
              >
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={22}
                  className={cn(
                    tone.fill,
                    "transition-all duration-200",
                    (active || highlighted) && !soldOut && "stroke-foreground stroke-[6]",
                  )}
                />
                {!soldOut && (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={22}
                    fill={`url(#${patternId}-${zone.kind === "seated" ? "rows" : "floor"})`}
                    className="pointer-events-none"
                  />
                )}
                <text textAnchor="middle" className={cn(tone.text, "pointer-events-none")}>
                  {words.map((word, index) => (
                    <tspan
                      key={word}
                      x={x + width / 2}
                      y={top + index * LINE_HEIGHT}
                      className="text-[40px] font-semibold"
                    >
                      {word}
                    </tspan>
                  ))}
                  <tspan x={x + width / 2} y={top + words.length * LINE_HEIGHT + 4} className="text-[32px]">
                    {caption}
                  </tspan>
                </text>
                {count > 0 && (
                  <g className="pointer-events-none">
                    <circle cx={x + width - 30} cy={y + 30} r={24} className="fill-foreground" />
                    <text
                      x={x + width - 30}
                      y={y + 30}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="fill-background text-[26px] font-bold"
                    >
                      {count}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {tooltip && (
          <MapTooltip position={tooltip.position}>
            <p className="font-semibold">{tooltip.zone.name}</p>
            <p className="text-background/75">
              {tooltip.zone.status === "sold-out"
                ? "Agotado"
                : `${formatPrice(tooltip.zone.price, currency)} · ${STATUS_TEXT[tooltip.zone.status]}`}
            </p>
            {tooltip.zone.status !== "sold-out" && (
              <p className="text-xs text-background/60">
                {tooltip.zone.kind === "seated"
                  ? "Numerada · toca para ver los asientos"
                  : "General · toca para elegir cantidad"}
              </p>
            )}
          </MapTooltip>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Precios:</span>
        {legend.map((item) => (
          <span key={item.id} className="flex items-center gap-1.5">
            <span className={cn("size-3 rounded", item.swatch)} />
            {item.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 sm:ml-auto">
          <span className="flex size-3 flex-col justify-between rounded bg-primary/60 p-[2px]">
            <span className="h-px bg-white/70" />
            <span className="h-px bg-white/70" />
          </span>
          Numerada
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex size-3 items-center justify-center rounded bg-primary/60">
            <span className="size-0.5 rounded-full bg-white/80" />
          </span>
          General
        </span>
      </div>
    </div>
  );
}
