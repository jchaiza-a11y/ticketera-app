import Link from "next/link";

import { EventCard, type Event } from "@/modules/events";

interface EventGridSectionProps {
  title: string;
  events: Event[];
  href: string;
}

export function EventGridSection({ title, events, href }: EventGridSectionProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-4 md:mb-8">
        <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
        <Link
          href={href}
          className="shrink-0 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          Ver todos
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
