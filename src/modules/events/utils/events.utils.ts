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

export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const value = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${value}`;
}
