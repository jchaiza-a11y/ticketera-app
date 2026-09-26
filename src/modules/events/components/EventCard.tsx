import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  EVENT_CATEGORY_LABELS,
  type Event,
} from "../schemas/events.schema";
import { formatEventDate, formatPrice } from "../utils/events.utils";

const STATUS_BADGES = {
  "low-stock": {
    label: "Últimas entradas",
    className: "bg-warning text-foreground",
  },
  "sold-out": { label: "Agotado", className: "bg-destructive text-white" },
} as const;

interface EventCardProps {
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const status = event.badge ? STATUS_BADGES[event.badge] : null;

  return (
    <Link href={`/events/${event.slug}`} className="group block">
      <Card
        className={cn(
          "gap-0 overflow-hidden rounded-xl p-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md",
          className,
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant="secondary">{EVENT_CATEGORY_LABELS[event.category]}</Badge>
            {status && (
              <Badge className={status.className}>{status.label}</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold capitalize text-primary">
            <CalendarDays className="size-4" />
            {formatEventDate(event.startsAt)}
          </p>
          <h3 className="line-clamp-2 text-lg font-semibold">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" />
            {event.venue}, {event.city}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Desde{" "}
            <span className="font-semibold text-brand-accent">
              {formatPrice(event.minPrice, event.currency)}
            </span>
          </p>
        </div>
      </Card>
    </Link>
  );
}
