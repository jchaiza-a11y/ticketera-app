import Link from "next/link";
import {
  Clapperboard,
  Drama,
  GraduationCap,
  Laugh,
  Martini,
  Music,
  Palette,
  PartyPopper,
  Presentation,
  Trophy,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  type EventCategory,
} from "@/modules/events";

const CATEGORY_ICONS: Record<EventCategory, LucideIcon> = {
  concert: Music,
  sports: Trophy,
  theater: Drama,
  festival: PartyPopper,
  family: Users,
  conference: Presentation,
  comedy: Laugh,
  cinema: Clapperboard,
  gastronomy: UtensilsCrossed,
  nightlife: Martini,
  exhibition: Palette,
  course: GraduationCap,
};

const CATEGORY_TONES = [
  "bg-primary",
  "bg-brand-accent",
  "bg-success",
  "bg-category-sky",
  "bg-category-rose",
  "bg-category-amber",
] as const;

export function CategoryList() {
  return (
    <section
      aria-labelledby="category-list-title"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8"
    >
      <h2
        id="category-list-title"
        className="mb-6 text-2xl font-semibold md:mb-8 md:text-3xl"
      >
        Explora por categoría
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-6">
        {EVENT_CATEGORIES.map((category, index) => {
          const Icon = CATEGORY_ICONS[category];
          const tone = CATEGORY_TONES[index % CATEGORY_TONES.length];
          return (
            <li key={category}>
              <Link
                href={`/events?category=${category}`}
                className="flex min-h-11 flex-col items-center gap-3 rounded-xl border bg-card p-4 text-sm font-medium text-card-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring motion-reduce:transition-none"
              >
                <span
                  className={`flex size-14 items-center justify-center rounded-2xl ${tone}`}
                >
                  <Icon className="size-7 text-white" aria-hidden="true" />
                </span>
                {EVENT_CATEGORY_LABELS[category]}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
