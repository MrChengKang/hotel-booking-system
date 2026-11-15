import { fireEvent, render, screen, within } from "@testing-library/react";
import HotelDetailPage from "./HotelDetailPage";
import { stays } from "../../data/stays";
import { addDays, parseDate, todayKey } from "../../utils/dates";

// Native dialog behavior is verified in the browser; jsdom needs these methods.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
});
afterAll(() => { delete HTMLDialogElement.prototype.showModal; delete HTMLDialogElement.prototype.close; });

function renderHotel() {
  return render(<HotelDetailPage hotel={stays[0]} isSaved={false} onToggleSaved={jest.fn()} onBack={jest.fn()} onNotify={jest.fn()} />);
}

test("shows hotel information and the complete rate breakdown", () => {
  renderHotel();
  expect(screen.getByRole("heading", { level: 1, name: stays[0].name })).toBeInTheDocument();
  expect(screen.getByLabelText("Reservation total")).toHaveTextContent("$939.60");
  fireEvent.click(screen.getByRole("button", { name: "Show all 11 amenities" }));
  expect(screen.getByText("Luggage storage")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reserve", exact: true }));
  expect(screen.getByRole("dialog", { name: "Reservation preview" })).toHaveTextContent("No payment has been taken");
  fireEvent.click(screen.getByRole("button", { name: "Continue exploring" }));
  expect(screen.queryByRole("dialog", { name: "Reservation preview" })).not.toBeInTheDocument();
});

test("date changes update the sticky quote and incomplete dates disable Reserve", () => {
  renderHotel();
  const calendar = within(screen.getByRole("group", { name: "Availability calendar" }));
  const dateLabel = (value) => parseDate(value).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  fireEvent.click(calendar.getByRole("button", { name: dateLabel(todayKey()) }));
  expect(screen.getByRole("button", { name: "Reserve", exact: true })).toBeDisabled();
  fireEvent.click(calendar.getByRole("button", { name: dateLabel(addDays(todayKey(), 1)) }));
  expect(screen.getByLabelText("Reservation total")).toHaveTextContent("$345.60");
  expect(screen.getByRole("button", { name: "Reserve", exact: true })).toBeEnabled();
});

test("gallery navigation, capacity checks, and local reviews work", () => {
  renderHotel();
  fireEvent.click(screen.getByRole("button", { name: "View hotel photo 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
  expect(screen.getByRole("dialog")).toHaveAccessibleName("Hotel photos · 2 / 5");
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  fireEvent.click(screen.getByRole("button", { name: "Change reservation guests" }));
  expect(screen.getByRole("button", { name: "Add adult" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Remove adult" }));
  fireEvent.click(screen.getByRole("button", { name: "Add child" }));
  expect(screen.getByLabelText("Children count")).toHaveTextContent("1");
  fireEvent.pointerDown(document.body);
  fireEvent.change(screen.getByRole("textbox", { name: "Your review" }), { target: { value: "Lovely hotel and a very comfortable room." } });
  fireEvent.click(screen.getByRole("button", { name: "Submit review" }));
  expect(screen.getByText("Lovely hotel and a very comfortable room.")).toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("Review added to this preview only");
});
