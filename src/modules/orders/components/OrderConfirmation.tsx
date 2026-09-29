"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Download,
  ExternalLink,
  Loader2,
  Mail,
  QrCode,
  SearchX,
  Ticket,
} from "lucide-react";
import { PurchaseSteps } from "@/components/shared/PurchaseSteps";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  EVENT_CATEGORY_LABELS,
  formatEventDate,
  formatPrice,
  type Event,
} from "@/modules/events";
import { useOrderHydrated, useOrderStore, type Order } from "../store/order.store";
import {
  buildGoogleCalendarUrl,
  buildIcsDataUrl,
  buildTicketPayload,
  buildTicketQr,
  expandTickets,
} from "../utils/ticketArtifacts";

const NEXT_STEPS = [
  {
    icon: Mail,
    title: "Revisa tu correo",
    text: "Ahí llegan tus entradas y el comprobante de pago.",
  },
  {
    icon: QrCode,
    title: "Muestra tu QR",
    text: "Cada entrada tiene su propio QR. Muéstralo desde tu celular en el ingreso.",
  },
  {
    icon: Ticket,
    title: "Todo en Mis entradas",
    text: "Entra con tu cuenta para ver y descargar tus entradas cuando quieras.",
  },
];

function TicketQrCode({ payload, label }: { payload: string; label: string }) {
  const qr = buildTicketQr(payload);
  return (
    <svg
      viewBox={`-2 -2 ${qr.size + 4} ${qr.size + 4}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className="size-40 rounded-lg bg-white"
    >
      {qr.modules.map((dark, index) =>
        dark ? (
          <rect
            key={index}
            x={index % qr.size}
            y={Math.floor(index / qr.size)}
            width={1}
            height={1}
            className="fill-foreground"
          />
        ) : null,
      )}
    </svg>
  );
}

async function downloadPdf(order: Order, event: Event) {
  // jsPDF is ~300 kB; it only loads when someone actually asks for the file.
  const { buildTicketsPdf, getTicketsPdfFileName } = await import("../utils/ticketsPdf");
  buildTicketsPdf(order, event).save(getTicketsPdfFileName(order));
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

interface OrderConfirmationProps {
  event: Event;
}

export function OrderConfirmation({ event }: OrderConfirmationProps) {
  const hydrated = useOrderHydrated();
  const order = useOrderStore((state) => state.lastOrder);
  const [ticketIndex, setTicketIndex] = useState(0);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  if (!hydrated) {
    return <div className="mx-auto min-h-[60vh] w-full max-w-4xl" aria-busy="true" />;
  }

  if (!order || order.eventSlug !== event.slug) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="mx-auto mt-8 max-w-lg items-center gap-3 rounded-2xl px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <SearchX className="size-7" />
          </span>
          <h1 className="text-xl font-semibold">No encontramos tu compra</h1>
          <p className="text-muted-foreground">
            Si ya pagaste, revisa tu correo: ahí están tus entradas.
          </p>
          <Button className="mt-2 h-11 px-5" nativeButton={false} render={<Link href="/events" />}>
            Explorar eventos
          </Button>
        </Card>
      </div>
    );
  }

  const tickets = expandTickets(order);
  const current = Math.min(ticketIndex, tickets.length - 1);
  const ticket = tickets[current];
  const zones = [...new Set(order.lines.map((line) => line.zoneName))].join(", ");
  const ticketLabel = `Entrada ${ticket.number} de ${ticket.total}`;
  const calendarEvent = {
    title: event.title,
    startsAt: event.startsAt,
    venue: event.venue,
    city: event.city,
    orderId: order.id,
  };

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      await downloadPdf(order, event);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-8 px-4 pb-16 pt-6 sm:px-6 md:pt-8">
      <PurchaseSteps current={3} className="self-stretch print:hidden md:self-end" />

      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CircleCheck className="size-9" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">¡Compra confirmada!</h1>
        <p className="max-w-lg leading-relaxed text-muted-foreground md:text-lg">
          Enviamos tus entradas a <span className="font-medium text-foreground">{order.buyer.email}</span>.
          También las tienes siempre en Mis entradas.
        </p>
        <span className="flex h-9 items-center rounded-full border bg-card px-4 text-sm">
          Pedido N.º <strong className="ml-1.5 font-semibold">{order.id}</strong>
        </span>
      </div>

      <article className="flex w-full flex-col overflow-hidden rounded-3xl border bg-card md:flex-row">
        <div className="relative h-40 shrink-0 md:h-auto md:w-48">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            sizes="(min-width: 768px) 192px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-1 flex-col gap-2 p-6">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {EVENT_CATEGORY_LABELS[event.category]}
          </span>
          <h2 className="text-2xl font-bold tracking-tight">{event.title}</h2>
          <p className="capitalize text-muted-foreground">
            {formatEventDate(event.startsAt)} · {event.venue}, {event.city}
          </p>
          <div className="mt-auto flex flex-wrap gap-x-8 gap-y-3 pt-4">
            <Detail label={zones.includes(",") ? "Zonas" : "Zona"} value={zones} />
            <Detail label="Entradas" value={String(order.count)} />
            <Detail label="Total pagado" value={formatPrice(order.total, order.currency)} />
          </div>
        </div>

        <div className="relative flex shrink-0 flex-col items-center justify-center gap-3 border-t-2 border-dashed p-6 md:w-64 md:border-l-2 md:border-t-0">
          <span aria-hidden="true" className="absolute -left-3 -top-3 size-6 rounded-full border bg-background md:-top-3" />
          <span aria-hidden="true" className="absolute -right-3 -top-3 size-6 rounded-full border bg-background md:-bottom-3 md:-left-3 md:right-auto md:top-auto" />
          <TicketQrCode
            payload={buildTicketPayload(order, ticket)}
            label={`Código QR de la entrada ${ticket.number} de ${ticket.total}`}
          />
          <p className="text-center text-sm">
            <span className="block font-medium">{ticket.zoneName}</span>
            <span className="text-muted-foreground">{ticket.detail}</span>
          </p>
          <div className="flex w-full items-center justify-between gap-1 print:hidden">
            {tickets.length > 1 && (
              <Button
                variant="ghost"
                className="size-10 shrink-0"
                aria-label="Entrada anterior"
                disabled={current === 0}
                onClick={() => setTicketIndex(current - 1)}
              >
                <ChevronLeft className="size-5" />
              </Button>
            )}
            <span
              aria-live="polite"
              className="flex-1 whitespace-nowrap text-center text-sm font-medium text-muted-foreground"
            >
              {ticketLabel}
            </span>
            {tickets.length > 1 && (
              <Button
                variant="ghost"
                className="size-10 shrink-0"
                aria-label="Entrada siguiente"
                disabled={current === tickets.length - 1}
                onClick={() => setTicketIndex(current + 1)}
              >
                <ChevronRight className="size-5" />
              </Button>
            )}
          </div>
        </div>
      </article>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row print:hidden">
        <Button className="h-12 gap-2 px-6 text-base" nativeButton={false} render={<Link href="/my-tickets" />}>
          Ver mis entradas
          <ArrowRight className="size-5" />
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2 px-5"
          nativeButton={false}
          render={
            <a
              href={buildIcsDataUrl(calendarEvent, new Date(order.createdAt))}
              download={`${event.slug}.ics`}
            />
          }
        >
          <CalendarPlus className="size-5" />
          Agregar al calendario
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2 px-5"
          disabled={generatingPdf}
          onClick={handleDownloadPdf}
        >
          {generatingPdf ? <Loader2 className="size-5 animate-spin" /> : <Download className="size-5" />}
          {generatingPdf ? "Generando…" : "Descargar PDF"}
        </Button>
      </div>
      <a
        href={buildGoogleCalendarUrl(calendarEvent)}
        target="_blank"
        rel="noopener noreferrer"
        className="-mt-5 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline print:hidden"
      >
        ¿Usas Google Calendar? Agrégalo aquí
        <ExternalLink className="size-3.5" />
      </a>

      <ol className="grid w-full gap-4 md:grid-cols-3 print:hidden">
        {NEXT_STEPS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col gap-2.5 rounded-2xl border bg-card p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
              <Icon className="size-5" />
            </span>
            <span className="font-semibold">{title}</span>
            <span className="text-sm leading-relaxed text-muted-foreground">{text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
