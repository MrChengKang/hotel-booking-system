import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import DateRangePicker from "./DateRangePicker";

function CalendarHarness({ onComplete = jest.fn(), initialStart = "2026-11-06", initialEnd = "2026-11-09" }) {
  const [range, setRange] = useState([initialStart, initialEnd]);
  return (
    <>
      <output aria-label="Selected range">{range.join(" / ")}</output>
      <DateRangePicker
        checkIn={range[0]}
        checkOut={range[1]}
        minDate="2026-11-06"
        onChange={(start, end) => setRange([start, end])}
        onComplete={onComplete}
      />
    </>
  );
}

test("shows consecutive months and disables dates before today", () => {
  render(<CalendarHarness />);
  expect(screen.getByRole("table", { name: "November 2026" })).toBeInTheDocument();
  expect(screen.getByRole("table", { name: "December 2026" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Thursday, November 5, 2026" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Friday, November 6, 2026" })).toHaveFocus();
});

test("selects a range across both months and previews the dates in between", () => {
  const onComplete = jest.fn();
  render(<CalendarHarness onComplete={onComplete} />);
  fireEvent.click(screen.getByRole("button", { name: "Sunday, November 29, 2026" }));
  const end = screen.getByRole("button", { name: "Thursday, December 3, 2026" });
  fireEvent.mouseEnter(end);
  expect(screen.getByRole("button", { name: "Tuesday, December 1, 2026" }).closest("td")).toHaveClass("range-day");
  expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();
  fireEvent.click(end);
  expect(screen.getByLabelText("Selected range")).toHaveTextContent("2026-11-29 / 2026-12-03");
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test("an earlier or equal second date restarts selection instead of creating an invalid range", () => {
  render(<CalendarHarness />);
  const later = screen.getByRole("button", { name: "Friday, November 20, 2026" });
  const earlier = screen.getByRole("button", { name: "Sunday, November 15, 2026" });
  fireEvent.click(later);
  fireEvent.click(earlier);
  expect(screen.getByLabelText("Selected range")).toHaveTextContent("2026-11-15 /");
  fireEvent.click(earlier);
  expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Monday, November 16, 2026" }));
  expect(screen.getByLabelText("Selected range")).toHaveTextContent("2026-11-15 / 2026-11-16");
});

test("navigates through December into the next year and back", () => {
  render(<CalendarHarness />);
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));
  expect(screen.getByRole("table", { name: "January 2027" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tuesday, December 1, 2026" })).toHaveAttribute("tabindex", "0");
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));
  expect(screen.getByRole("table", { name: "February 2027" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
  expect(screen.getByRole("table", { name: "December 2026" })).toBeInTheDocument();
});

test("moves keyboard focus across a month boundary and supports leap day", () => {
  const view = render(<CalendarHarness initialStart="2026-11-30" initialEnd="2026-12-03" />);
  const lastDay = screen.getByRole("button", { name: "Monday, November 30, 2026" });
  fireEvent.keyDown(lastDay, { key: "ArrowRight" });
  expect(screen.getByRole("button", { name: "Tuesday, December 1, 2026" })).toHaveFocus();
  view.unmount();
  render(<CalendarHarness initialStart="2028-02-28" initialEnd="2028-03-02" />);
  expect(within(screen.getByRole("table", { name: "February 2028" })).getByRole("button", { name: "Tuesday, February 29, 2028" })).toBeInTheDocument();
});
