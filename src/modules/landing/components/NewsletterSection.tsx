"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const emailSchema = z.email();

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailSchema.safeParse(email.trim()).success) {
      setConfirmed(false);
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setError(null);
    setConfirmed(true);
    setEmail("");
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <h2 className="text-2xl font-semibold md:text-3xl">
          No te pierdas ningún evento
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Suscríbete y recibe novedades y preventas en tu correo.
        </p>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input
            type="email"
            name="email"
            aria-label="Correo electrónico"
            placeholder="tu@correo.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={error ? true : undefined}
            className="h-11"
          />
          <Button type="submit" className="h-11 px-6 text-base">
            Suscribirme
          </Button>
        </form>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {confirmed && (
          <p role="status" className="text-sm text-success">
            ¡Listo! Te suscribiste correctamente.
          </p>
        )}
      </div>
    </section>
  );
}
