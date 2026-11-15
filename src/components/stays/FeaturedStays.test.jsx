import { fireEvent, render, screen } from "@testing-library/react";
import FeaturedStays from "./FeaturedStays";

test("shows only hotel rooms and filters them by city", () => {
  render(<FeaturedStays />);
  expect(screen.getAllByRole("article")).toHaveLength(3);
  expect(screen.getAllByText(/Hotel room/)).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "London", exact: true }));
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByText("Double room at Hart House")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /View all/ }));
  expect(screen.getAllByRole("article")).toHaveLength(3);
});

test("preserves a saved hotel when switching cities", () => {
  render(<FeaturedStays />);
  const favoriteName = "Save Double room at Hart House";
  fireEvent.click(screen.getByRole("button", { name: favoriteName }));
  fireEvent.click(screen.getByRole("button", { name: "Paris", exact: true }));
  expect(screen.queryByRole("button", { name: favoriteName })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "All", exact: true }));
  expect(screen.getByRole("button", { name: favoriteName })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: favoriteName }));
  expect(screen.getByRole("button", { name: favoriteName })).toHaveAttribute("aria-pressed", "false");
});
