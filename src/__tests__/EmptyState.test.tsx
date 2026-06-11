import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Package } from "lucide-react";
import EmptyState from "@/components/EmptyState";

describe("EmptyState Component", () => {
  it("renders the icon, title, and description correctly", () => {
    render(
      <EmptyState
        icon={Package}
        title="Test Title"
        description="Test Description"
      />
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Description")).toBeInTheDocument();
  });

  it("does not render description if not provided", () => {
    render(
      <EmptyState
        icon={Package}
        title="Test Title Only"
      />
    );

    expect(screen.getByText("Test Title Only")).toBeInTheDocument();
    expect(screen.queryByText("Test Description")).not.toBeInTheDocument();
  });

  it("renders action button and triggers onClick when clicked", () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        icon={Package}
        title="Test Title"
        action={{
          label: "Click Me",
          onClick: handleClick,
        }}
      />
    );

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not render action button if not provided", () => {
    render(
      <EmptyState
        icon={Package}
        title="Test Title"
      />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
