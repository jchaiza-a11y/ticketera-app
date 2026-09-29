import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EVENTS } from "@/modules/events";
import { Checkout } from "@/modules/orders";

const findEvent = (slug: string) => EVENTS.find((event) => event.slug === slug);

export function generateStaticParams() {
  return EVENTS.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]/checkout">): Promise<Metadata> {
  const event = findEvent((await params).slug);
  return { title: event ? `Pago · ${event.title} | Ticketera` : "Ticketera" };
}

export default async function CheckoutPage({ params }: PageProps<"/events/[slug]/checkout">) {
  const event = findEvent((await params).slug);
  if (!event) notFound();

  return <Checkout event={event} />;
}
