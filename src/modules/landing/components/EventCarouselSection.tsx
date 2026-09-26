import Link from "next/link";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EventCard, type Event } from "@/modules/events";

interface EventCarouselSectionProps {
  title: string;
  events: Event[];
  href: string;
}

export function EventCarouselSection({
  title,
  events,
  href,
}: EventCarouselSectionProps) {
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
      <Carousel opts={{ align: "start" }} aria-label={title}>
        <CarouselContent className="-ml-4 md:-ml-6">
          {events.map((event) => (
            <CarouselItem
              key={event.id}
              className="basis-full pl-4 sm:basis-1/2 md:pl-6 lg:basis-1/4"
            >
              <EventCard event={event} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 bg-background" />
        <CarouselNext className="right-2 bg-background" />
      </Carousel>
    </section>
  );
}
