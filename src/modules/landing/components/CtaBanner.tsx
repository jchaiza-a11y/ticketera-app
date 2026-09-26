import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaBanner() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between md:py-16 lg:px-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Publica tu evento
          </h2>
          <p className="max-w-prose leading-relaxed">
            Llega a miles de personas y vende tus entradas en minutos.
          </p>
        </div>
        <Link
          href="/events/new"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "h-11 px-6 text-base"
          )}
        >
          Publicar evento
        </Link>
      </div>
    </section>
  );
}
