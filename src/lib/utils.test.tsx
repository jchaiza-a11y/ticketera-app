import { render, screen } from "@testing-library/react";
import { cn } from "./utils";

describe("cn", () => {
  it("merges conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("renders with jsx", () => {
    render(<p className={cn("font-bold")}>hello</p>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
