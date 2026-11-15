import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LiveHotelList from "./LiveHotelList";
import { getHotels, getAvailability } from "../../services/hotelApi";
jest.mock("../../services/hotelApi");
const hotel = { id: 42, name: "Actual Hotel", city: "Raub", countryCode: "MY", currencyCode: "MYR", address: "1 Street", startingNightlyPrice: 149, roomTypeId: 71 };
beforeEach(() => { jest.clearAllMocks(); getHotels.mockResolvedValue({ items: [hotel], totalElements: 13, totalPages: 2, page: 0 }); });

test("uses one server-filtered list request and carries the matching room into booking", async () => {
  const open = jest.fn(); const page = jest.fn();
  const search = { checkIn: "2027-01-01", checkOut: "2027-01-03", rooms: "2", guests: "4", minPrice: "100", maxPrice: "200", currency: "MYR", amenities: "WIFI,POOL", sort: "price_asc" };
  render(<LiveHotelList city="Raub" search={search} onOpenHotel={open} onPageChange={page} onToggleSaved={jest.fn()} />);
  const link = await screen.findByRole("link", { name: "View Actual Hotel" });
  expect(getHotels).toHaveBeenCalledWith({ ...search, city: "Raub", page: 0, size: 12 }, expect.anything());
  expect(getAvailability).not.toHaveBeenCalled();
  expect(screen.getByRole("status")).toHaveTextContent("13 matching hotels");
  expect(screen.getByText(/149.00/)).toHaveTextContent("MYR");
  expect(link).toHaveAttribute("href", "/hotel/42?checkIn=2027-01-01&checkOut=2027-01-03&rooms=2&guests=4&roomTypeId=71");
  fireEvent.click(link);
  expect(open).toHaveBeenCalledWith(hotel, { checkIn: search.checkIn, checkOut: search.checkOut, rooms: "2", guests: "4", roomTypeId: 71 });
  fireEvent.click(screen.getByRole("button", { name: "Next hotels" })); expect(page).toHaveBeenCalledWith(1);
});

test("an empty server result describes the whole search and does not suggest unfiltered next pages", async () => {
  getHotels.mockResolvedValue({ items: [], totalElements: 0, totalPages: 0, page: 0 });
  render(<LiveHotelList search={{ checkIn: "2027-01-01", checkOut: "2027-01-02" }} />);
  await screen.findByRole("heading", { name: "No matching hotels" });
  expect(screen.getByText("No hotels match your dates and filters. Try other dates or clear some filters.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next hotels" })).not.toBeInTheDocument();
});

test("home pagination stays functional without routing props", async () => {
  render(<LiveHotelList onToggleSaved={jest.fn()} />);
  fireEvent.click(await screen.findByRole("button", { name: "Next hotels" }));
  await waitFor(() => expect(getHotels).toHaveBeenLastCalledWith({ city: "", page: 1, size: 12 }, expect.anything()));
});
