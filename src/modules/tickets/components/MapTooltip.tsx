import type { ReactNode } from "react";

export interface TooltipPosition {
  left: number;
  top: number;
}

// Measures on screen (not in SVG units) so the position stays right at any zoom level.
export function getTooltipPosition(target: Element, container: HTMLElement | null): TooltipPosition | null {
  if (!container) return null;
  const box = target.getBoundingClientRect();
  const frame = container.getBoundingClientRect();
  return { left: box.left + box.width / 2 - frame.left, top: box.top - frame.top };
}

export function MapTooltip({ position, children }: { position: TooltipPosition; children: ReactNode }) {
  return (
    <div
      role="tooltip"
      style={{ left: position.left, top: position.top }}
      className="pointer-events-none absolute z-20 w-max max-w-56 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-xl bg-foreground px-3 py-2 text-sm text-background shadow-lg animate-in fade-in zoom-in-95 duration-150"
    >
      {children}
      <span className="absolute left-1/2 top-full size-2.5 -translate-x-1/2 -translate-y-1.5 rotate-45 bg-foreground" />
    </div>
  );
}
