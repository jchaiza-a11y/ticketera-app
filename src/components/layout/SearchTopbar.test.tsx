import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchTopbar } from "./SearchTopbar";

describe("SearchTopbar", () => {
  it("envía un GET a /events con los campos q, date y price", () => {
    const { container } = render(<SearchTopbar />);

    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/events");
    expect(form).toHaveAttribute("method", "get");
    expect(screen.getByRole("searchbox")).toHaveAttribute("name", "q");
    expect(screen.getByLabelText("Fecha")).toHaveAttribute("name", "date");
    expect(container.querySelector('input[name="price"]')).toBeInTheDocument();
  });

  it("alterna fecha y precio con el botón Filtros", async () => {
    const user = userEvent.setup();
    render(<SearchTopbar />);

    const toggle = screen.getByRole("button", { name: /filtros/i });
    const panel = document.getElementById(
      toggle.getAttribute("aria-controls") as string,
    ) as HTMLElement;

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveClass("hidden");
    expect(panel).toContainElement(screen.getByLabelText("Fecha"));

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(panel).not.toHaveClass("hidden");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(panel).toHaveClass("hidden");
  });
});
