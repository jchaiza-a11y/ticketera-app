"use client";

import { useEffect, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Clock,
  CreditCard,
  FlaskConical,
  Loader2,
  Lock,
  ShoppingBag,
  Smartphone,
  Store,
  TicketX,
} from "lucide-react";
import { PurchaseSteps } from "@/components/shared/PurchaseSteps";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatEventDate, formatPrice, type Event } from "@/modules/events";
import {
  checkoutSchema,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  getFieldErrors,
  type Buyer,
  type DocumentType,
  type PaymentMethod,
} from "../schemas/checkout.schema";
import { useOrderHydrated, useOrderStore, type OrderDraft } from "../store/order.store";

const PROCESSING_DELAY_MS = 1000;
const FORM_ID = "checkout-form";

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { value: "card", label: "Tarjeta", icon: CreditCard },
  { value: "yape", label: "Yape", icon: Smartphone },
  { value: "cash", label: "PagoEfectivo", icon: Store },
];

const PAYMENT_NOTES: Partial<Record<PaymentMethod, { icon: typeof CreditCard; text: string }>> = {
  yape: {
    icon: Smartphone,
    text: "Al continuar te mostraremos un código QR para pagar desde tu app de Yape.",
  },
  cash: {
    icon: Store,
    text: "Generaremos un código de pago para que pagues en agentes, bodegas o tu banca móvil.",
  },
};

const EMPTY_BUYER: Buyer = {
  fullName: "",
  email: "",
  documentType: "DNI",
  documentNumber: "",
  phone: "",
};

const EMPTY_CARD = { cardNumber: "", expiry: "", cvv: "", cardName: "" };

// Nothing is charged: these values let anyone run the flow end to end in one click.
const TEST_BUYER: Buyer = {
  fullName: "María Quispe",
  email: "maria.quispe@correo.pe",
  documentType: "DNI",
  documentNumber: "45678912",
  phone: "987654321",
};

const TEST_CARD = {
  cardNumber: "4111 1111 1111 1111",
  expiry: "12/30",
  cvv: "123",
  cardName: "MARIA QUISPE",
};

const fieldId = (key: string) => `checkout-${key.replace(/\./g, "-")}`;

// base-ui puts the checkbox id on a hidden native input; focus the visible control instead.
function focusField(key: string) {
  const element = document.getElementById(fieldId(key));
  const target =
    element?.getAttribute("aria-hidden") === "true"
      ? element.closest("label")?.querySelector<HTMLElement>('[role="checkbox"]')
      : element;
  target?.focus();
}

const formatCardNumber =(value: string) =>
  value.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");

const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

function useRemainingTime(expiresAt: number | undefined): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (expiresAt === undefined) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return expiresAt === undefined ? 0 : Math.max(0, expiresAt - now);
}

interface TextFieldProps extends ComponentProps<typeof Input> {
  name: string;
  label: string;
  error?: string;
  className?: string;
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-destructive">
      *
    </span>
  );
}

function TextField({ name, label, error, className, required, ...inputProps }: TextFieldProps) {
  const id = fieldId(name);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <RequiredMark />}
      </label>
      <Input
        id={id}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-11 rounded-xl bg-card text-base md:text-sm"
        {...inputProps}
      />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="gap-5 rounded-2xl p-5 md:p-7">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </Card>
  );
}

interface OrderSummaryCardProps {
  event: Event;
  draft: OrderDraft;
  ticketsHref: string;
}

function OrderSummaryCard({ event, draft, ticketsHref }: OrderSummaryCardProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3.5">
        <Image
          src={event.imageUrl}
          alt=""
          width={64}
          height={64}
          className="size-16 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0">
          <p className="font-semibold">{event.title}</p>
          <p className="text-sm capitalize text-muted-foreground">
            {formatEventDate(event.startsAt)} · {event.venue}, {event.city}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-3 border-t pt-4">
        {draft.summary.lines.map((line) => (
          <li key={line.zoneId} className="flex justify-between gap-3 text-sm">
            <span className="flex flex-col">
              <span className="font-medium">
                {line.quantity} × {line.zoneName}
              </span>
              <span className="text-muted-foreground">{line.detail}</span>
            </span>
            <span className="font-semibold tabular-nums">
              {formatPrice(line.amount, draft.currency)}
            </span>
          </li>
        ))}
      </ul>
      <Link href={ticketsHref} className="w-fit text-sm font-semibold text-primary hover:underline">
        Cambiar entradas
      </Link>
      <div className="flex items-baseline justify-between border-t-2 border-dashed pt-4">
        <span className="font-medium">Total</span>
        <span className="text-2xl font-bold tracking-tight tabular-nums">
          {formatPrice(draft.summary.total, draft.currency)}
        </span>
      </div>
    </div>
  );
}

interface PayButtonProps {
  total: string;
  disabled: boolean;
  processing: boolean;
  className?: string;
}

function PayButton({ total, disabled, processing, className }: PayButtonProps) {
  return (
    <Button
      type="submit"
      form={FORM_ID}
      variant="cta"
      disabled={disabled || processing}
      className={cn("h-12 w-full gap-2 rounded-xl text-base", className)}
    >
      {processing ? <Loader2 className="size-5 animate-spin" /> : <Lock className="size-5" />}
      {processing ? "Procesando…" : `Pagar ${total}`}
    </Button>
  );
}

function ErrorSummary({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <p role="alert" className="text-center text-sm font-medium text-destructive">
      {count === 1 ? "Hay 1 campo por corregir." : `Hay ${count} campos por corregir.`} Revisa los
      marcados en rojo.
    </p>
  );
}

function EmptyCheckout({ ticketsHref, expired }: { ticketsHref: string; expired: boolean }) {
  return (
    <Card className="mx-auto mt-8 max-w-lg items-center gap-3 rounded-2xl px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
        {expired ? <Clock className="size-7" /> : <TicketX className="size-7" />}
      </span>
      <h1 className="text-xl font-semibold">
        {expired ? "Tu reserva venció" : "No tienes entradas seleccionadas"}
      </h1>
      <p className="text-muted-foreground">
        {expired
          ? "Liberamos tus entradas para otras personas. Vuelve a elegirlas para continuar."
          : "Elige tus entradas para continuar con la compra."}
      </p>
      <Button className="mt-2 h-11 px-5" nativeButton={false} render={<Link href={ticketsHref} />}>
        Elegir entradas
      </Button>
    </Card>
  );
}

interface CheckoutProps {
  event: Event;
}

export function Checkout({ event }: CheckoutProps) {
  const router = useRouter();
  const hydrated = useOrderHydrated();
  const storedDraft = useOrderStore((state) => state.draft);
  const [submittedDraft, setSubmittedDraft] = useState<OrderDraft | null>(null);

  const [buyer, setBuyer] = useState<Buyer>(EMPTY_BUYER);
  const [card, setCard] = useState(EMPTY_CARD);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);

  // placeOrder clears the draft; keep showing the submitted one until navigation finishes.
  const draft =
    storedDraft?.eventSlug === event.slug ? storedDraft : submittedDraft;
  const remaining = useRemainingTime(draft?.expiresAt);
  const expired = Boolean(draft) && remaining === 0 && !processing;

  const eventHref = `/events/${event.slug}`;
  const ticketsHref = `${eventHref}/tickets`;

  if (!hydrated) {
    return <div className="mx-auto min-h-[60vh] w-full max-w-7xl" aria-busy="true" />;
  }

  if (!draft || expired) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EmptyCheckout ticketsHref={ticketsHref} expired={expired} />
      </div>
    );
  }

  const total = formatPrice(draft.summary.total, draft.currency);
  const updateBuyer = (patch: Partial<Buyer>) => setBuyer((current) => ({ ...current, ...patch }));
  const updateCard = (patch: Partial<typeof EMPTY_CARD>) =>
    setCard((current) => ({ ...current, ...patch }));

  const handleSubmit = (formEvent: FormEvent) => {
    formEvent.preventDefault();
    const result = checkoutSchema.safeParse({
      buyer,
      payment: method === "card" ? { method, ...card } : { method },
      acceptedTerms,
    });

    if (!result.success) {
      const nextErrors = getFieldErrors(result.error);
      setErrors(nextErrors);
      focusField(Object.keys(nextErrors)[0]);
      return;
    }

    setErrors({});
    setProcessing(true);
    setSubmittedDraft(draft);
    window.setTimeout(() => {
      useOrderStore.getState().placeOrder(result.data.buyer, result.data.payment);
      router.push(`${eventHref}/confirmation`);
    }, PROCESSING_DELAY_MS);
  };

  const paymentNote = PAYMENT_NOTES[method];
  const errorCount = Object.keys(errors).length;

  const fillTestData = () => {
    setBuyer(TEST_BUYER);
    setCard(TEST_CARD);
    setMethod("card");
    setAcceptedTerms(true);
    setErrors({});
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 md:pt-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Datos y pago</h1>
        <PurchaseSteps current={2} />
      </div>

      <p
        aria-live="polite"
        className="mt-5 flex items-center gap-3 rounded-2xl border border-warning/50 bg-warning/15 px-4 py-3.5 text-sm md:text-base"
      >
        <Clock className="size-5 shrink-0" />
        <span>
          Reservamos tus entradas por{" "}
          <strong className="tabular-nums">{formatCountdown(remaining)}</strong>. Completa el
          pago antes de que se liberen.
        </span>
      </p>

      <details className="group mt-5 rounded-2xl border bg-card lg:hidden">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
          <ShoppingBag className="size-5 text-primary" />
          <span className="flex-1 font-medium">
            Ver resumen · {draft.summary.count} {draft.summary.count === 1 ? "entrada" : "entradas"}
          </span>
          <span className="font-semibold tabular-nums">{total}</span>
          <ChevronDown className="size-5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t p-4">
          <OrderSummaryCard event={event} draft={draft} ticketsHref={ticketsHref} />
        </div>
      </details>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <form id={FORM_ID} noValidate onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-accent p-4 sm:flex-row sm:items-center">
            <FlaskConical className="size-5 shrink-0 text-primary" />
            <p className="flex-1 text-sm">
              <span className="font-semibold">Pago simulado.</span> No se realiza ningún cobro:
              puedes usar cualquier tarjeta de 13 a 19 dígitos o completar todo con datos de prueba.
            </p>
            <Button type="button" variant="outline" className="h-10 shrink-0 px-4" onClick={fillTestData}>
              Completar con datos de prueba
            </Button>
          </div>
          <Section
            title="Datos del comprador"
            description="Enviaremos tus entradas al correo que indiques. Los campos con * son obligatorios."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                required
                name="buyer.fullName"
                label="Nombre completo"
                autoComplete="name"
                placeholder="Como figura en tu documento"
                value={buyer.fullName}
                error={errors["buyer.fullName"]}
                onChange={(e) => updateBuyer({ fullName: e.target.value })}
              />
              <TextField
                required
                name="buyer.email"
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={buyer.email}
                error={errors["buyer.email"]}
                onChange={(e) => updateBuyer({ email: e.target.value })}
              />
              <div className="flex flex-col gap-2">
                <label htmlFor={fieldId("buyer.documentNumber")} className="text-sm font-medium">
                  Documento de identidad
                  <RequiredMark />
                </label>
                <div className="flex gap-2">
                  <Select
                    value={buyer.documentType}
                    onValueChange={(value) => updateBuyer({ documentType: value as DocumentType })}
                  >
                    <SelectTrigger
                      aria-label="Tipo de documento"
                      className="w-32 shrink-0 rounded-xl bg-card data-[size=default]:h-11"
                    >
                      <SelectValue>
                        {(value: DocumentType) => DOCUMENT_TYPE_LABELS[value]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {DOCUMENT_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id={fieldId("buyer.documentNumber")}
                    aria-required
                    inputMode={buyer.documentType === "PASAPORTE" ? "text" : "numeric"}
                    placeholder="Número"
                    value={buyer.documentNumber}
                    aria-invalid={Boolean(errors["buyer.documentNumber"])}
                    aria-describedby={
                      errors["buyer.documentNumber"]
                        ? `${fieldId("buyer.documentNumber")}-error`
                        : undefined
                    }
                    onChange={(e) => updateBuyer({ documentNumber: e.target.value })}
                    className="h-11 min-w-0 flex-1 rounded-xl bg-card text-base md:text-sm"
                  />
                </div>
                <FieldError
                  id={`${fieldId("buyer.documentNumber")}-error`}
                  message={errors["buyer.documentNumber"]}
                />
              </div>
              <TextField
                required
                name="buyer.phone"
                label="Celular"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="987 654 321"
                value={buyer.phone}
                error={errors["buyer.phone"]}
                onChange={(e) => updateBuyer({ phone: e.target.value.replace(/\D/g, "").slice(0, 9) })}
              />
            </div>
          </Section>

          <Section title="Método de pago">
            <RadioGroup
              aria-label="Método de pago"
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
              className="grid-cols-1 gap-3 sm:grid-cols-3"
            >
              {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
                <label
                  key={value}
                  className="flex h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 font-semibold transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-accent"
                >
                  <RadioGroupItem value={value} />
                  <Icon className="size-5 text-muted-foreground" />
                  {label}
                </label>
              ))}
            </RadioGroup>

            {method === "card" ? (
              <div className="grid gap-5 md:grid-cols-4">
                <TextField
                  required
                  name="payment.cardNumber"
                  label="Número de tarjeta"
                  className="md:col-span-2"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="0000 0000 0000 0000"
                  value={card.cardNumber}
                  error={errors["payment.cardNumber"]}
                  onChange={(e) => updateCard({ cardNumber: formatCardNumber(e.target.value) })}
                />
                <TextField
                  required
                  name="payment.expiry"
                  label="Vencimiento"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  value={card.expiry}
                  error={errors["payment.expiry"]}
                  onChange={(e) => updateCard({ expiry: formatExpiry(e.target.value) })}
                />
                <TextField
                  required
                  name="payment.cvv"
                  label="CVV"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="3 o 4 dígitos"
                  value={card.cvv}
                  error={errors["payment.cvv"]}
                  onChange={(e) => updateCard({ cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                />
                <TextField
                  required
                  name="payment.cardName"
                  label="Nombre en la tarjeta"
                  className="md:col-span-4"
                  autoComplete="cc-name"
                  placeholder="Como aparece en la tarjeta"
                  value={card.cardName}
                  error={errors["payment.cardName"]}
                  onChange={(e) => updateCard({ cardName: e.target.value })}
                />
              </div>
            ) : (
              paymentNote && (
                <p className="flex items-center gap-3.5 rounded-2xl bg-accent px-5 py-4 leading-relaxed text-primary">
                  <paymentNote.icon className="size-5 shrink-0" />
                  {paymentNote.text}
                </p>
              )
            )}
          </Section>

          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <Checkbox
                id={fieldId("acceptedTerms")}
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked)}
                aria-invalid={Boolean(errors.acceptedTerms)}
                className="size-5"
              />
              <span>
                Acepto los{" "}
                <Link href="/terms" className="font-medium text-primary hover:underline">
                  Términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/privacy" className="font-medium text-primary hover:underline">
                  Política de privacidad
                </Link>
                .
              </span>
            </label>
            <FieldError id={`${fieldId("acceptedTerms")}-error`} message={errors.acceptedTerms} />
          </div>

          <div className="flex flex-col gap-2 lg:hidden">
            <PayButton total={total} disabled={!acceptedTerms} processing={processing} />
            <ErrorSummary count={errorCount} />
            {!acceptedTerms && (
              <p className="text-center text-sm text-muted-foreground">
                Acepta los términos para continuar.
              </p>
            )}
          </div>
        </form>

        <aside aria-label="Resumen de la compra" className="hidden lg:sticky lg:top-36 lg:block">
          <Card className="gap-5 rounded-2xl p-6 shadow-md">
            <OrderSummaryCard event={event} draft={draft} ticketsHref={ticketsHref} />
            <PayButton total={total} disabled={!acceptedTerms} processing={processing} />
            <ErrorSummary count={errorCount} />
            <p className="-mt-2 text-center text-sm text-muted-foreground">
              {acceptedTerms ? "Pago 100 % seguro" : "Acepta los términos para continuar."}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
