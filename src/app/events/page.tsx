import type { Metadata } from "next";
import {
  EVENTS,
  EventSearch,
  parseEventFilters,
  toSearchParams,
} from "@/modules/events";

export const metadata: Metadata = {
  title: "Explora eventos | Ticketera",
};

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const filters = parseEventFilters(await searchParams);

  // The key remounts the search when a link (Navbar, topbar) navigates to new params.
  return (
    <EventSearch
      key={toSearchParams(filters).toString()}
      events={EVENTS}
      initialFilters={filters}
    />
  );
}
