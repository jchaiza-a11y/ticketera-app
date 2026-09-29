import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  DoorOpen,
  MapPin,
  Navigation,
  QrCode,
  Ticket,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EVENT_CATEGORY_LABELS, type Event } from "../schemas/events.schema";
import { getEventDetails } from "../utils/events.details";
import { formatEventLongDate, formatPrice } from "../utils/events.utils";
import { EventCard } from "./EventCard";

export interface EventTier {
  id: string;
  name: string;
  price: number;
  status: "available" | "low-stock" | "sold-out";
}

const TIER_BADGES = {
  "low-stock": { label: "Últimas", className: "bg-warning text-foreground" },
  "sold-out": { label: "Agotado", className: "bg-destructive text-white" },
} as const;

interface EventDetailProps {
  event: Event;
  tiers: EventTier[];
  related: Event[];
}

interface BuyButtonProps {
  event: Event;
  soldOut: boolean;
  className?: string;
  variant?: "cta" | "default";
  label?: string;
}

function BuyButton({
  event,
  soldOut,
  className,
  variant = "cta",
  label = "Comprar entradas",
}: BuyButtonProps) {
  if (soldOut) {
    return (
      <Button variant={variant} disabled className={className}>
        Agotado
      </Button>
    );
  }
  return (
    <Button
      variant={variant}
      className={className}
      nativeButton={false}
      render={<Link href={`/events/${event.slug}/tickets`} />}
    >
      <Ticket className="size-5" />
      {label}
    </Button>
  );
}

export function EventDetail({ event, tiers, related }: EventDetailProps) {
  const details = getEventDetails(event);
  const longDate = formatEventLongDate(event.startsAt);
  const soldOut = event.badge === "sold-out" || tiers.every((tier) => tier.status === "sold-out");
  const minPrice = formatPrice(event.minPrice, event.currency);
  const categoryLabel = EVENT_CATEGORY_LABELS[event.category];
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${event.venue}, ${event.city}`,
  )}`;

  const info = [
    { icon: DoorOpen, label: "Apertura de puertas", value: details.doorsOpenAt },
    { icon: Clock, label: "Inicio del show", value: details.startsAt },
    { icon: UserCheck, label: "Edad mínima", value: details.minimumAge },
    { icon: QrCode, label: "Ingreso", value: "Entrada digital con QR" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-8 lg:pb-16">
      <nav aria-label="Ruta">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <Link href={`/events?category=${event.category}`} className="hover:text-foreground">
              {categoryLabel}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="truncate font-medium text-foreground">
            {event.title}
          </li>
        </ol>
      </nav>

      <section className="mt-4 grid overflow-hidden rounded-3xl border bg-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="order-2 flex flex-col gap-5 p-6 md:p-10 lg:order-1">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{categoryLabel}</Badge>
            {event.badge && (
              <Badge className={TIER_BADGES[event.badge].className}>
                {event.badge === "sold-out" ? "Agotado" : "Últimas entradas"}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{event.title}</h1>
          <ul className="flex flex-col gap-2.5 text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <CalendarDays className="size-5 text-primary" />
              {longDate.charAt(0).toUpperCase() + longDate.slice(1)}
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="size-5 text-primary" />
              {details.startsAt}
            </li>
            <li className="flex items-center gap-2.5">
              <MapPin className="size-5 text-primary" />
              {event.venue}, {event.city}
            </li>
          </ul>
          <div className="mt-auto hidden items-center gap-4 border-t pt-5 lg:flex">
            <p className="flex flex-col">
              <span className="text-sm text-muted-foreground">Entradas desde</span>
              <span className="text-2xl font-bold text-brand-accent">{minPrice}</span>
            </p>
            <BuyButton event={event} soldOut={soldOut} className="ml-auto h-12 gap-2 rounded-xl px-6 text-base" />
          </div>
        </div>
        <div className="relative order-1 aspect-[16/10] lg:order-2 lg:aspect-auto lg:min-h-96">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold">Acerca del evento</h2>
            <p className="max-w-prose leading-relaxed text-muted-foreground">{details.description}</p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Información importante</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {info.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3.5 rounded-2xl border bg-card p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold">Lugar</h2>
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <MapPin className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{event.venue}</p>
                <p className="text-sm text-muted-foreground">{event.city}, Perú</p>
              </div>
              <Button
                variant="outline"
                className="h-11 gap-2 px-4"
                nativeButton={false}
                render={<a href={mapsHref} target="_blank" rel="noopener noreferrer" />}
              >
                <Navigation className="size-4" />
                Cómo llegar
              </Button>
            </div>
          </section>
        </div>

        <aside aria-label="Entradas" className="lg:sticky lg:top-36">
          <Card className="gap-4 rounded-2xl p-6 shadow-md">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-semibold">Entradas</h2>
              <span className="text-sm text-muted-foreground">
                desde <strong className="text-brand-accent">{minPrice}</strong>
              </span>
            </div>
            <ul className="flex flex-col">
              {tiers.map((tier) => {
                const badge = tier.status === "available" ? null : TIER_BADGES[tier.status];
                return (
                  <li key={tier.id} className="flex min-h-12 items-center gap-2 border-t py-2 text-sm">
                    <span className={tier.status === "sold-out" ? "text-muted-foreground" : "font-medium"}>
                      {tier.name}
                    </span>
                    {badge && <Badge className={badge.className}>{badge.label}</Badge>}
                    <span className="ml-auto font-semibold tabular-nums">
                      {formatPrice(tier.price, event.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <BuyButton
              event={event}
              soldOut={soldOut}
              variant="default"
              label="Elegir entradas"
              className="hidden h-12 w-full gap-2 rounded-xl text-base lg:inline-flex"
            />
            <p className="text-center text-xs text-muted-foreground">Pago seguro · Entrada digital con QR</p>
          </Card>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12 flex flex-col gap-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-semibold md:text-3xl">También te puede interesar</h2>
            <Link
              href={`/events?category=${event.category}`}
              className="shrink-0 text-sm font-medium text-primary hover:underline"
            >
              Ver más {categoryLabel.toLowerCase()}
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <EventCard event={item} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <p className="flex flex-col">
            <span className="text-xs text-muted-foreground">Desde</span>
            <span className="text-xl font-bold text-brand-accent">{minPrice}</span>
          </p>
          <BuyButton event={event} soldOut={soldOut} className="ml-auto h-12 gap-2 rounded-xl px-5 text-base" />
        </div>
      </div>
    </div>
  );
}
