import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS } from "@/modules/events";
import { TicketSelection, VENUE_MAP } from "@/modules/tickets";

const findEvent = (slug: string) => EVENTS.find((event) => event.slug === slug);

export function generateStaticParams() {
  return EVENTS.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]/tickets">): Promise<Metadata> {
  const event = findEvent((await params).slug);
  return { title: event ? `Entradas · ${event.title} | Ticketera` : "Ticketera" };
}

export default async function TicketsPage({
  params,
}: PageProps<"/events/[slug]/tickets">) {
  const event = findEvent((await params).slug);
  if (!event) notFound();

  return <TicketSelection event={event} venue={VENUE_MAP} />;
}
