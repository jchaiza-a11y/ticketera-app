import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { NewsletterSection } from "./NewsletterSection";

describe("NewsletterSection", () => {
  it("muestra error y no confirma con un correo inválido", async () => {
    const user = userEvent.setup();
    render(<NewsletterSection />);

    await user.type(screen.getByLabelText("Correo electrónico"), "no-es-correo");
    await user.click(screen.getByRole("button", { name: "Suscribirme" }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("confirma con un correo válido y limpia el campo", async () => {
    const user = userEvent.setup();
    render(<NewsletterSection />);
    const input = screen.getByLabelText("Correo electrónico");

    await user.type(input, "ana@correo.com");
    await user.click(screen.getByRole("button", { name: "Suscribirme" }));

    expect(screen.getByRole("status")).toHaveTextContent("suscribiste");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});
