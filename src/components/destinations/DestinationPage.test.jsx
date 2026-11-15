import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DestinationPage from "./DestinationPage";
import { destinations } from "../../data/destinations";

function CityHarness() {
  const [saved, setSaved] = useState([]);
  return <DestinationPage destination={destinations[0]} saved={saved} onToggleSaved={(id) => setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])} onSelectDestination={jest.fn()} onHome={jest.fn()} />;
}

test("filters the city hotel rooms and resets an empty result", () => {
  render(<CityHarness />);
  expect(screen.getByRole("heading", { name: "4 hotels in New York" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Room type" }));
  fireEvent.change(screen.getByLabelText("Room type"), { target: { value: "Suite" } });
  expect(screen.getByRole("heading", { name: "1 hotel in New York" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show hotels" }));
  fireEvent.click(screen.getByRole("button", { name: "Price per night" }));
  fireEvent.change(screen.getByRole("slider", { name: "Maximum nightly price" }), { target: { value: "50" } });
  expect(screen.getByText("No hotels match these filters")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show hotels" }));
  fireEvent.click(screen.getAllByRole("button", { name: "Reset filters" })[0]);
  expect(screen.getByRole("heading", { name: "4 hotels in New York" })).toBeInTheDocument();
});

test("toggles the map and saves a city hotel", () => {
  render(<CityHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Show map" }));
  expect(screen.getByTitle("Map of New York")).toHaveAttribute("src", expect.stringContaining("openstreetmap.org"));
  fireEvent.click(screen.getByRole("button", { name: "Hide map" }));
  expect(screen.queryByTitle("Map of New York")).not.toBeInTheDocument();
  const favorite = screen.getByRole("button", { name: "Save Queen room on the Lower East Side" });
  fireEvent.click(favorite);
  expect(favorite).toHaveAttribute("aria-pressed", "true");
});
