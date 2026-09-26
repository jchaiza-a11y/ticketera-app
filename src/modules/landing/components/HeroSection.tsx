"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { A11y, Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/a11y";
import { Button } from "@/components/ui/button";
import { formatEventDate, type Event } from "@/modules/events";

interface HeroSectionProps {
  events: Event[];
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotion() {
  return false;
}

export function HeroSection({ events }: HeroSectionProps) {
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  if (events.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">
      <Swiper
        key={prefersReducedMotion ? "static" : "auto"}
        modules={[Autoplay, Pagination, Navigation, A11y]}
        autoplay={
          prefersReducedMotion
            ? false
            : {
                delay: 6000,
                pauseOnMouseEnter: true,
                disableOnInteraction: false,
              }
        }
        pagination={{ clickable: true }}
        navigation
        a11y={{
          containerMessage: "Eventos destacados",
          prevSlideMessage: "Evento anterior",
          nextSlideMessage: "Evento siguiente",
          firstSlideMessage: "Este es el primer evento",
          lastSlideMessage: "Este es el último evento",
          paginationBulletMessage: "Ir al evento {{index}}",
        }}
        aria-label="Eventos destacados"
        className="rounded-xl [--swiper-navigation-color:white] [--swiper-navigation-size:28px] [--swiper-navigation-sides-offset:8px] [--swiper-pagination-bottom:12px] [--swiper-pagination-bullet-inactive-color:white] [--swiper-pagination-bullet-inactive-opacity:0.6] [--swiper-pagination-color:var(--brand-accent)] md:[--swiper-navigation-size:40px]"
      >
        {events.map((event, index) => (
          <SwiperSlide key={event.id}>
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl md:aspect-[21/9]">
              <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                sizes="(min-width: 1280px) 1216px, 100vw"
                priority={index === 0}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 px-12 pt-4 pb-10 sm:px-14 md:px-16 md:pb-12">
                <h2 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
                  {event.title}
                </h2>
                <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white">
                  <span className="flex items-center gap-1.5 capitalize">
                    <CalendarDays className="size-4 shrink-0" />
                    {formatEventDate(event.startsAt)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-4 shrink-0" />
                    {event.venue}, {event.city}
                  </span>
                </p>
                <Button
                  render={<Link href={`/events/${event.slug}`} />}
                  nativeButton={false}
                  size="lg"
                  className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                >
                  Comprar entradas
                </Button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
