"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS } from "@/modules/events";

import { NAV_CATEGORIES_LIMIT } from "./layout.constants";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b bg-background/60 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-primary"
        >
          <Ticket className="size-5" />
          Ticketera
        </Link>

        <nav
          aria-label="Categorías"
          className="ml-4 hidden items-center gap-1 lg:flex"
        >
          {EVENT_CATEGORIES.slice(0, NAV_CATEGORIES_LIMIT).map((category) => (
            <Link
              key={category}
              href={`/events?category=${category}`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-accent hover:text-primary"
            >
              {EVENT_CATEGORY_LABELS[category]}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Button
            className="hidden h-10 px-4 lg:inline-flex"
            render={<Link href="/login" />}
            nativeButton={false}
          >
            Ingresar
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 lg:hidden"
                  aria-label="Abrir menú"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Categorías móvil"
                className="flex flex-col gap-1 px-4"
              >
                {EVENT_CATEGORIES.map((category) => (
                  <Link
                    key={category}
                    href={`/events?category=${category}`}
                    onClick={() => setOpen(false)}
                    className="flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-foreground hover:bg-accent hover:text-primary"
                  >
                    {EVENT_CATEGORY_LABELS[category]}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto p-4">
                <Button
                  className="h-11 w-full"
                  render={<Link href="/login" onClick={() => setOpen(false)} />}
                  nativeButton={false}
                >
                  Ingresar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
