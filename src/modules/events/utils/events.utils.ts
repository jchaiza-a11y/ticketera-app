const EVENT_TIME_ZONE = "America/Lima";

const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: "S/",
  USD: "US$",
};

const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: EVENT_TIME_ZONE,
});

export function formatEventDate(iso: string): string {
  return dateFormatter
    .format(new Date(iso))
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const timeFormatter = new Intl.DateTimeFormat("es-PE", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: EVENT_TIME_ZONE,
});

const longDateFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: EVENT_TIME_ZONE,
});

// Intl uses narrow/no-break spaces in "p. m."; plain spaces keep output predictable.
const normalizeSpaces = (value: string) => value.replace(/\s/g, " ");

export function formatEventTime(iso: string): string {
  return normalizeSpaces(timeFormatter.format(new Date(iso)));
}

export function formatEventLongDate(iso: string): string {
  return normalizeSpaces(longDateFormatter.format(new Date(iso))).replace(",", "");
}

export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const value = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${value}`;
}
