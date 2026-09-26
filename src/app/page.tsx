import {
  EVENTS,
  getEventsByCity,
  getFeaturedEvents,
  getUpcomingEvents,
} from "@/modules/events";
import {
  CategoryList,
  CtaBanner,
  EventCarouselSection,
  EventGridSection,
  HeroSection,
  NewsletterSection,
} from "@/modules/landing";

export default function HomePage() {
  const featured = getFeaturedEvents(EVENTS);

  return (
    <>
      <h1 className="sr-only">
        Entradas para conciertos, deportes, teatro y festivales
      </h1>
      <HeroSection events={featured} />
      <CategoryList />
      <EventGridSection
        title="Eventos destacados"
        events={featured}
        href="/events?featured=true"
      />
      <EventCarouselSection
        title="Próximos eventos"
        events={getUpcomingEvents(EVENTS, new Date(), 8)}
        href="/events"
      />
      <EventGridSection
        title="Populares en Lima"
        events={getEventsByCity(EVENTS, "Lima", 4)}
        href="/events?city=Lima"
      />
      <CtaBanner />
      <NewsletterSection />
    </>
  );
}
