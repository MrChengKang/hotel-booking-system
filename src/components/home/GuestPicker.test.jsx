import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import GuestPicker from "./GuestPicker";
import { countGuests, DEFAULT_GUESTS, updateGuestCount } from "../../utils/guests";

function GuestHarness() {
  const [guests, setGuests] = useState({ ...DEFAULT_GUESTS });
  return (
    <>
      <span aria-label="Total guests">{countGuests(guests)}</span>
      <GuestPicker
        guests={guests}
        onChange={(type, amount) => setGuests((current) => updateGuestCount(current, type, amount))}
      />
    </>
  );
}

test("shows all guest types and their default counts", () => {
  render(<GuestHarness />);
  expect(screen.getByRole("group", { name: "Adults" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Children" })).toBeInTheDocument();
  expect(screen.getByRole("group", { name: "Infants" })).toBeInTheDocument();
  expect(screen.getByLabelText("Adults count")).toHaveTextContent("2");
  expect(screen.getByLabelText("Children count")).toHaveTextContent("0");
  expect(screen.getByLabelText("Infants count")).toHaveTextContent("0");
  expect(screen.getByRole("button", { name: "Remove adult" })).toHaveFocus();
});

test("updates each category independently and prevents counts below their minimum", () => {
  render(<GuestHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Remove adult" }));
  expect(screen.getByRole("button", { name: "Remove adult" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Remove child" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Remove infant" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Add child" }));
  fireEvent.click(screen.getByRole("button", { name: "Add infant" }));
  expect(screen.getByLabelText("Adults count")).toHaveTextContent("1");
  expect(screen.getByLabelText("Children count")).toHaveTextContent("1");
  expect(screen.getByLabelText("Infants count")).toHaveTextContent("1");
  expect(screen.getByLabelText("Total guests")).toHaveTextContent("3");
  fireEvent.click(screen.getByRole("button", { name: "Remove child" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove infant" }));
  expect(screen.getByLabelText("Total guests")).toHaveTextContent("1");
});

test("enforces the total limit across all categories and unlocks controls after removing a guest", () => {
  render(<GuestHarness />);
  for (let index = 0; index < 14; index += 1) {
    fireEvent.click(screen.getByRole("button", { name: "Add adult" }));
  }
  expect(screen.getByLabelText("Total guests")).toHaveTextContent("16");
  for (const name of ["Add adult", "Add child", "Add infant"]) {
    expect(screen.getByRole("button", { name })).toBeDisabled();
  }
  fireEvent.click(screen.getByRole("button", { name: "Remove adult" }));
  fireEvent.click(screen.getByRole("button", { name: "Add child" }));
  expect(screen.getByLabelText("Adults count")).toHaveTextContent("15");
  expect(screen.getByLabelText("Children count")).toHaveTextContent("1");
  expect(screen.getByLabelText("Total guests")).toHaveTextContent("16");
});
