import { fireEvent, render, screen } from "@testing-library/react";
import HotelPhotos, { HotelCover } from "./HotelPhotos";
import { getHotelImages } from "../../services/hotelApi";
jest.mock("../../services/hotelApi");
beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); }; HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); }; });
test("public gallery opens real media and supports next photo", async () => {
  getHotelImages.mockResolvedValue([{ id: 1, url: "/api/media/1", altText: "Lobby" }, { id: 2, url: "/api/media/2", altText: "Pool" }]);
  render(<HotelPhotos hotelId={7} roomId={3} name="King room" />);
  fireEvent.click(await screen.findByRole("button", { name: "Show all 2 photos" }));
  expect(screen.getByRole("dialog")).toHaveAccessibleName("King room · 1 / 2");
  fireEvent.click(screen.getByRole("button", { name: "Next photo →" }));
  expect(screen.getByRole("dialog")).toHaveAccessibleName("King room · 2 / 2");
  expect(screen.getByRole("dialog").querySelector("img").src).toBe("http://localhost:8080/api/media/2");
  expect(getHotelImages).toHaveBeenCalledWith(7, 3, expect.any(AbortSignal));
});
test("unavailable or missing cover uses an honest placeholder", () => {
  render(<HotelCover url="/api/media/1" name="Test hotel" />);
  fireEvent.error(screen.getByRole("img", { name: "Test hotel" }));
  expect(screen.getByRole("img", { name: "No photos for Test hotel" })).toBeInTheDocument();
});
