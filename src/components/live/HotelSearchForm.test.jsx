import { fireEvent, render, screen } from "@testing-library/react";
import HotelSearchForm from "./HotelSearchForm";

test("applies dates, occupancy, currency, price, beds and all chosen amenities together", () => {
  const apply = jest.fn();
  render(<HotelSearchForm city="Kuala Lumpur" search={{}} onSearch={apply} onClear={jest.fn()} />);
  fireEvent.change(screen.getByLabelText("Check in"), { target: { value: "2027-01-01" } });
  fireEvent.change(screen.getByLabelText("Check out"), { target: { value: "2027-01-04" } });
  fireEvent.change(screen.getByLabelText("Rooms"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Guests"), { target: { value: "5" } });
  fireEvent.click(screen.getByText("Price, facilities & sorting"));
  fireEvent.change(screen.getByLabelText("Hotel currency"), { target: { value: "MYR" } });
  fireEvent.change(screen.getByLabelText("Minimum per night"), { target: { value: "100" } });
  fireEvent.change(screen.getByLabelText("Maximum per night"), { target: { value: "300" } });
  fireEvent.change(screen.getByLabelText("Minimum beds per room"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "price_asc" } });
  fireEvent.click(screen.getByLabelText("Wi-Fi")); fireEvent.click(screen.getByLabelText("Swimming pool"));
  fireEvent.submit(screen.getByRole("form", { name: "Search hotels" }));
  expect(apply).toHaveBeenCalledWith({ city: "Kuala Lumpur", checkIn: "2027-01-01", checkOut: "2027-01-04", rooms: "2", guests: "5", currency: "MYR", minPrice: "100", maxPrice: "300", minBeds: "2", sort: "price_asc", amenities: "WIFI,POOL" });
});

test("incomplete dates and unordered price ranges keep the form open with a useful error", () => {
  const apply = jest.fn();
  render(<HotelSearchForm city="" search={{ checkIn: "2027-01-01" }} onSearch={apply} onClear={jest.fn()} />);
  fireEvent.submit(screen.getByRole("form"));
  expect(screen.getByRole("alert")).toHaveTextContent("Choose a check-out date after check-in.");
  fireEvent.change(screen.getByLabelText("Check out"), { target: { value: "2027-01-02" } });
  fireEvent.change(screen.getByLabelText("Hotel currency"), { target: { value: "MYR" } });
  fireEvent.change(screen.getByLabelText("Minimum per night"), { target: { value: "300" } });
  fireEvent.change(screen.getByLabelText("Maximum per night"), { target: { value: "100" } });
  fireEvent.submit(screen.getByRole("form"));
  expect(screen.getByRole("alert")).toHaveTextContent("Minimum price cannot exceed maximum price.");
  expect(apply).not.toHaveBeenCalled();
});

test("requires a currency for prices, restores deep links and clears filters explicitly", () => {
  const clear = jest.fn(); const apply = jest.fn();
  render(<HotelSearchForm city="London" search={{ maxPrice: "200", amenities: "PARKING", minBeds: "2" }} onSearch={apply} onClear={clear} />);
  expect(screen.getByLabelText("Parking")).toBeChecked();
  expect(screen.getByLabelText("Minimum beds per room")).toHaveValue(2);
  expect(screen.getByLabelText("Hotel currency")).toContainHTML('value="GBP"');
  fireEvent.submit(screen.getByRole("form"));
  expect(screen.getByRole("alert")).toHaveTextContent("Choose a currency");
  expect(apply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" })); expect(clear).toHaveBeenCalledTimes(1);
});
