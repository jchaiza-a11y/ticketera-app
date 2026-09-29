export const QR_SIZE = 21;
const FINDER_SIZE = 7;
const EVENT_DURATION_MS = 3 * 60 * 60 * 1000;

const FINDER_ORIGINS = [
  [0, 0],
  [0, QR_SIZE - FINDER_SIZE],
  [QR_SIZE - FINDER_SIZE, 0],
] as const;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Returns null outside the finder zones (marks plus their one-cell light border).
function finderCell(row: number, col: number): boolean | null {
  for (const [originRow, originCol] of FINDER_ORIGINS) {
    const r = row - originRow;
    const c = col - originCol;
    if (r < -1 || r > FINDER_SIZE || c < -1 || c > FINDER_SIZE) continue;
    const inside = r >= 0 && r < FINDER_SIZE && c >= 0 && c < FINDER_SIZE;
    const ring = r === 0 || r === FINDER_SIZE - 1 || c === 0 || c === FINDER_SIZE - 1;
    const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
    return inside && (ring || core);
  }
  return null;
}

// Decorative QR-like pattern, not a scannable code: there is no backend payload to encode yet.
export function buildQrPattern(seed: string): boolean[] {
  let state = hashSeed(seed);
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };

  return Array.from({ length: QR_SIZE * QR_SIZE }, (_, index) => {
    const fixed = finderCell(Math.floor(index / QR_SIZE), index % QR_SIZE);
    return fixed ?? next() > 0.5;
  });
}

interface IcsEventInput {
  title: string;
  startsAt: string;
  venue: string;
  city: string;
  orderId: string;
}

const toIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const escapeIcsText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function buildIcsEvent(event: IcsEventInput, now: Date = new Date()): string {
  const start = new Date(event.startsAt);
  const end = new Date(start.getTime() + EVENT_DURATION_MS);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ticketera//Entradas//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.orderId}@ticketera`,
    `DTSTAMP:${toIcsDate(now)}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(`${event.venue}, ${event.city}`)}`,
    `DESCRIPTION:${escapeIcsText(`Pedido N.º ${event.orderId}. Muestra tu QR en el ingreso.`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
