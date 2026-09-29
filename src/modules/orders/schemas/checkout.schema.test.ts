import {
  buyerSchema,
  checkoutSchema,
  getFieldErrors,
  paymentSchema,
} from "./checkout.schema";

const validBuyer = {
  fullName: "María Quispe",
  email: "maria@correo.pe",
  documentType: "DNI",
  documentNumber: "45678912",
  phone: "987654321",
};

const validCard = {
  method: "card",
  cardNumber: "4111 1111 1111 1111",
  expiry: "12/40",
  cvv: "123",
  cardName: "MARIA QUISPE",
};

describe("buyerSchema", () => {
  it("accepts a valid buyer", () => {
    expect(buyerSchema.safeParse(validBuyer).success).toBe(true);
  });

  it.each([
    ["email", { email: "maria@" }],
    ["documentNumber", { documentNumber: "4567891" }],
    ["documentNumber", { documentType: "CE", documentNumber: "12345678" }],
    ["documentNumber", { documentType: "PASAPORTE", documentNumber: "AB-12" }],
    ["phone", { phone: "887654321" }],
    ["fullName", { fullName: "Al" }],
  ])("rejects an invalid %s", (field, patch) => {
    const result = buyerSchema.safeParse({ ...validBuyer, ...patch });
    expect(result.success).toBe(false);
    if (!result.success) expect(getFieldErrors(result.error)).toHaveProperty(field);
  });

  it("accepts CE and passport formats", () => {
    expect(
      buyerSchema.safeParse({ ...validBuyer, documentType: "CE", documentNumber: "001234567" }).success,
    ).toBe(true);
    expect(
      buyerSchema.safeParse({ ...validBuyer, documentType: "PASAPORTE", documentNumber: "AB123456" })
        .success,
    ).toBe(true);
  });
});

describe("paymentSchema", () => {
  it("accepts a valid card and strips spaces from the number", () => {
    const result = paymentSchema.safeParse(validCard);
    expect(result.success).toBe(true);
    if (result.success && result.data.method === "card") {
      expect(result.data.cardNumber).toBe("4111111111111111");
    }
  });

  it.each([
    ["cardNumber", { cardNumber: "4111" }],
    ["cardNumber", { cardNumber: "4111 1111 abcd 1111" }],
    ["expiry", { expiry: "01/20" }],
    ["expiry", { expiry: "13/40" }],
    ["cvv", { cvv: "12" }],
  ])("rejects an invalid %s", (field, patch) => {
    const result = paymentSchema.safeParse({ ...validCard, ...patch });
    expect(result.success).toBe(false);
    if (!result.success) expect(getFieldErrors(result.error)).toHaveProperty(field);
  });

  it("accepts any 13 to 19 digit number because the payment is simulated", () => {
    expect(paymentSchema.safeParse({ ...validCard, cardNumber: "1234 5678 1234 5678" }).success).toBe(true);
  });

  it("does not ask for card data with Yape or PagoEfectivo", () => {
    expect(paymentSchema.safeParse({ method: "yape" }).success).toBe(true);
    expect(paymentSchema.safeParse({ method: "cash" }).success).toBe(true);
  });
});

describe("checkoutSchema", () => {
  it("requires accepting the terms and reports nested paths", () => {
    const result = checkoutSchema.safeParse({
      buyer: { ...validBuyer, email: "" },
      payment: { method: "yape" },
      acceptedTerms: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = getFieldErrors(result.error);
      expect(Object.keys(errors)).toEqual(expect.arrayContaining(["buyer.email", "acceptedTerms"]));
    }
  });

  it("accepts a complete checkout", () => {
    expect(
      checkoutSchema.safeParse({ buyer: validBuyer, payment: validCard, acceptedTerms: true }).success,
    ).toBe(true);
  });
});
