import { fireEvent, render, screen } from "@testing-library/react";
import Destinations from "./Destinations";
import { getHotelDestinations } from "../../services/hotelApi";
import i18n from "../../i18n";
jest.mock("../../services/hotelApi");
beforeEach(() => { jest.clearAllMocks(); i18n.changeLanguage("en-US"); });

test("a single real city uses a wide card and preserves the complete city in navigation", async () => {
  getHotelDestinations.mockResolvedValue([{ city: "Raub, Pahang", hotelCount: 1, coverImageUrl: "/api/media/8" }]);
  const select = jest.fn();
  const { container } = render(<Destinations onSelectDestination={select} />);
  const link = await screen.findByRole("link");
  expect(link).toHaveAttribute("href", "/hotels?city=Raub%2C+Pahang");
  expect(screen.getByText("1 hotel on STAY")).toBeInTheDocument();
  expect(container.querySelector(".is-single")).toBeInTheDocument();
  expect(screen.queryByText("New York, USA")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next destinations" })).not.toBeInTheDocument();
  fireEvent.click(link); expect(select).toHaveBeenCalledWith("Raub, Pahang");
});
test("multiple cities display real counts without single-card styling", async () => {
  getHotelDestinations.mockResolvedValue([{ city: "Raub", hotelCount: 2 }, { city: "Tokyo", hotelCount: 1 }]);
  const { container } = render(<Destinations />);
  expect(await screen.findByText("2 hotels on STAY")).toBeInTheDocument();
  expect(screen.getAllByRole("link")).toHaveLength(2);
  expect(container.querySelector(".is-single")).not.toBeInTheDocument();
});
test("empty data shows a compact honest state and browse action", async () => {
  getHotelDestinations.mockResolvedValue([]); const browse = jest.fn();
  render(<Destinations onBrowseAll={browse} />);
  expect(await screen.findByText("New destinations are on their way")).toBeInTheDocument();
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "View all hotels" })); expect(browse).toHaveBeenCalled();
});
test("an API error offers retry rather than fabricated destinations", async () => {
  getHotelDestinations.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce([{ city: "Raub", hotelCount: 1 }]);
  render(<Destinations />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
  expect(screen.queryByText("New destinations are on their way")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByRole("link")).toHaveTextContent("Raub");
});
