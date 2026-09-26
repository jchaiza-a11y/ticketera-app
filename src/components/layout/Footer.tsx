import Link from "next/link";
import { Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from "@/modules/events";

import {
  COMPANY_LINKS,
  HELP_LINKS,
  PAYMENT_METHODS,
  SOCIAL_LINKS,
  type FooterLink,
} from "./layout.constants";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-background/70 transition-all duration-200 hover:text-background"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const categoryLinks: FooterLink[] = EVENT_CATEGORIES.map((category) => ({
    label: EVENT_CATEGORY_LABELS[category],
    href: `/events?category=${category}`,
  }));

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <Ticket className="size-5" />
              Ticketera
            </Link>
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-background/70">
              Vive los mejores conciertos, deportes, teatro y festivales.
            </p>
            <ul className="mt-6 flex gap-2">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    aria-label={label}
                    className="flex size-11 items-center justify-center rounded-full border border-background/20 transition-all duration-200 hover:bg-background/10"
                  >
                    <Icon className="size-5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <FooterColumn title="Categorías" links={categoryLinks} />
          <FooterColumn title="Empresa" links={COMPANY_LINKS} />
          <FooterColumn title="Ayuda" links={HELP_LINKS} />
        </div>

        <Separator className="my-8 bg-background/20" />

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide uppercase">
              Medios de pago
            </p>
            <ul className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <li key={method}>
                  <Badge
                    variant="outline"
                    className="border-background/30 text-background"
                  >
                    {method}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-background/70">
            © {new Date().getFullYear()} Ticketera. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
