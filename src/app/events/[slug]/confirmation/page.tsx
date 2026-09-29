import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS } from "@/modules/events";
import { OrderConfirmation } from "@/modules/orders";

const findEvent = (slug: string) => EVENTS.find((event) => event.slug === slug);

export function generateStaticParams() {
  return EVENTS.map((event) => ({ slug: event.slug }));
}

export const metadata: Metadata = {
  title: "Compra confirmada | Ticketera",
};

export default async function ConfirmationPage({
  params,
}: PageProps<"/events/[slug]/confirmation">) {
  const event = findEvent((await params).slug);
  if (!event) notFound();

  return <OrderConfirmation event={event} />;
}
