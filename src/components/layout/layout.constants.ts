import { AtSign, Globe, Share2, Video } from "lucide-react";

export type FooterLink = { label: string; href: string };

export const SOCIAL_LINKS = [
  { label: "Sitio web", href: "#", icon: Globe },
  { label: "Correo", href: "#", icon: AtSign },
  { label: "Videos", href: "#", icon: Video },
  { label: "Compartir", href: "#", icon: Share2 },
];

export const COMPANY_LINKS: FooterLink[] = [
  { label: "Nosotros", href: "/about" },
  { label: "Publica tu evento", href: "/organizers" },
  { label: "Trabaja con nosotros", href: "/careers" },
  { label: "Prensa", href: "/press" },
];

export const HELP_LINKS: FooterLink[] = [
  { label: "Centro de ayuda", href: "/help" },
  { label: "Términos y condiciones", href: "/terms" },
  { label: "Políticas de privacidad", href: "/privacy" },
  { label: "Libro de reclamaciones", href: "/complaints" },
];

export const PAYMENT_METHODS = [
  "Visa",
  "Mastercard",
  "American Express",
  "Yape",
  "Plin",
  "PagoEfectivo",
] as const;

export const NAV_CATEGORIES_LIMIT = 6;

export const PRICE_RANGES = [
  { value: "", label: "Cualquier precio" },
  { value: "0-50", label: "Hasta S/ 50" },
  { value: "50-100", label: "S/ 50 a S/ 100" },
  { value: "100-200", label: "S/ 100 a S/ 200" },
  { value: "200-", label: "Más de S/ 200" },
] as const;
