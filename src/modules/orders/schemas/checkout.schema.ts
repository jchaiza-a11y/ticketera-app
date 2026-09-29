import { z } from "zod";

export const DOCUMENT_TYPES = ["DNI", "CE", "PASAPORTE"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  DNI: "DNI",
  CE: "CE",
  PASAPORTE: "Pasaporte",
};

const DOCUMENT_RULES: Record<DocumentType, { pattern: RegExp; message: string }> = {
  DNI: { pattern: /^\d{8}$/, message: "El DNI tiene 8 dígitos" },
  CE: { pattern: /^\d{9,12}$/, message: "El CE tiene entre 9 y 12 dígitos" },
  PASAPORTE: { pattern: /^[A-Z0-9]{6,12}$/i, message: "Ingresa entre 6 y 12 letras o números" },
};

export const buyerSchema = z
  .object({
    fullName: z.string().trim().min(3, "Ingresa tu nombre completo"),
    email: z.email("Ingresa un correo válido"),
    documentType: z.enum(DOCUMENT_TYPES),
    documentNumber: z.string().trim(),
    phone: z
      .string()
      .trim()
      .regex(/^9\d{8}$/, "Ingresa un celular de 9 dígitos que empiece en 9"),
  })
  .superRefine((buyer, ctx) => {
    const rule = DOCUMENT_RULES[buyer.documentType];
    if (!rule.pattern.test(buyer.documentNumber)) {
      ctx.addIssue({ code: "custom", path: ["documentNumber"], message: rule.message });
    }
  });

function isFutureExpiry(expiry: string): boolean {
  const [month, year] = expiry.split("/").map(Number);
  const now = new Date();
  const current = now.getFullYear() * 12 + now.getMonth() + 1;
  return (2000 + year) * 12 + month >= current;
}

const cardPaymentSchema = z.object({
  method: z.literal("card"),
  cardNumber: z
    .string()
    .transform((value) => value.replace(/\s+/g, ""))
    // Payments are simulated, so any 13-19 digit number is accepted (no Luhn check).
    .refine((value) => /^\d{13,19}$/.test(value), {
      message: "Ingresa un número de tarjeta de 13 a 19 dígitos",
    }),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Usa el formato MM/AA")
    .refine(isFutureExpiry, "La tarjeta está vencida"),
  cvv: z.string().trim().regex(/^\d{3,4}$/, "El CVV tiene 3 o 4 dígitos"),
  cardName: z.string().trim().min(3, "Ingresa el nombre como aparece en la tarjeta"),
});

export const PAYMENT_METHODS = ["card", "yape", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentSchema = z.discriminatedUnion("method", [
  cardPaymentSchema,
  z.object({ method: z.literal("yape") }),
  z.object({ method: z.literal("cash") }),
]);

export const checkoutSchema = z.object({
  buyer: buyerSchema,
  payment: paymentSchema,
  acceptedTerms: z.literal(true, "Acepta los términos para continuar"),
});

export type Buyer = z.infer<typeof buyerSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type CheckoutInput = z.input<typeof checkoutSchema>;

export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    errors[key] ??= issue.message;
  }
  return errors;
}
