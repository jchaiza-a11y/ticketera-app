import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS, EventDetail, getRelatedEvents } from "@/modules/events";
import { getVenueMapForEvent } from "@/modules/tickets";

const findEvent = (slug: string) => EVENTS.find((event) => event.slug === slug);

export function generateStaticParams() {
  return EVENTS.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  const event = findEvent((await params).slug);
  return { title: event ? `${event.title} | Ticketera` : "Ticketera" };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const event = findEvent((await params).slug);
  if (!event) notFound();

  return (
    <EventDetail
      event={event}
      tiers={getVenueMapForEvent(event).zones}
      related={getRelatedEvents(EVENTS, event)}
    />
  );
}
