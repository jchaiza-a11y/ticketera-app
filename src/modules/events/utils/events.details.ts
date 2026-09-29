import type { Event, EventCategory } from "../schemas/events.schema";
import { formatEventTime } from "./events.utils";

const DOORS_OPEN_BEFORE_MS = 60 * 60 * 1000;

export interface EventDetails {
  doorsOpenAt: string;
  startsAt: string;
  minimumAge: string;
  description: string;
}

const ALL_AGES: EventCategory[] = ["family", "cinema", "course"];
const ADULTS_ONLY: EventCategory[] = ["nightlife"];

const DESCRIPTIONS: Record<EventCategory, (e: Event) => string> = {
  concert: (e) =>
    `${e.title} llega a ${e.venue} con un show en vivo de más de dos horas, pantallas gigantes y los temas que todos quieren cantar. Una noche para vivirla de principio a fin en ${e.city}.`,
  festival: (e) =>
    `${e.title} reúne a varios artistas en escenarios simultáneos, zona de comida y experiencias para todo el día en ${e.venue}, ${e.city}. Llega temprano y arma tu propia ruta.`,
  sports: (e) =>
    `Vive ${e.title} desde las tribunas de ${e.venue}. Ambiente de fiesta, hinchadas a pleno y un partido que se juega a estadio lleno en ${e.city}.`,
  theater: (e) =>
    `${e.title} sube al escenario de ${e.venue} con un elenco de primer nivel. Una puesta en escena de aproximadamente dos horas con intermedio, en ${e.city}.`,
  family: (e) =>
    `${e.title} es un plan para toda la familia en ${e.venue}, ${e.city}: música, juegos y personajes que harán reír a grandes y chicos.`,
  conference: (e) =>
    `${e.title} reúne a líderes y especialistas en una jornada de charlas, paneles y networking en ${e.venue}, ${e.city}. Incluye acceso a todas las salas.`,
  comedy: (e) =>
    `${e.title}: una noche de stand up con los comediantes del momento en ${e.venue}, ${e.city}. Risas aseguradas durante todo el show.`,
  cinema: (e) =>
    `${e.title} proyecta una selección de películas en ${e.venue}, ${e.city}. Trae tu manta y disfruta del cine en un formato distinto.`,
  gastronomy: (e) =>
    `${e.title} te lleva por lo mejor de la cocina local en ${e.venue}, ${e.city}, con degustaciones, cocineros invitados y bebidas.`,
  nightlife: (e) =>
    `${e.title} en ${e.venue}, ${e.city}: DJ en vivo, coctelería de autor y una vista que acompaña toda la noche.`,
  exhibition: (e) =>
    `${e.title} presenta obras de artistas nacionales e internacionales en ${e.venue}, ${e.city}. Recorrido libre con guías en sala.`,
  course: (e) =>
    `${e.title} es una jornada práctica en ${e.venue}, ${e.city}, con instructores expertos y materiales incluidos. Cupos limitados.`,
};

function getMinimumAge(category: EventCategory): string {
  if (ALL_AGES.includes(category)) return "Todo público";
  if (ADULTS_ONLY.includes(category)) return "+18";
  return "+14";
}

// The mock schema has no schedule or description fields; they are derived so every event has them.
export function getEventDetails(event: Event): EventDetails {
  const doorsOpen = new Date(Date.parse(event.startsAt) - DOORS_OPEN_BEFORE_MS).toISOString();
  return {
    doorsOpenAt: formatEventTime(doorsOpen),
    startsAt: formatEventTime(event.startsAt),
    minimumAge: getMinimumAge(event.category),
    description: DESCRIPTIONS[event.category](event),
  };
}

export function getRelatedEvents(events: Event[], event: Event, limit = 4): Event[] {
  const candidates = events.filter((e) => e.id !== event.id && e.badge !== "sold-out");
  const sameCategory = candidates.filter((e) => e.category === event.category);
  const sameCity = candidates.filter(
    (e) => e.category !== event.category && e.city === event.city,
  );
  return [...sameCategory, ...sameCity].slice(0, limit);
}
