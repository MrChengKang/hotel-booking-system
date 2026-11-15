import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import HostPhotos from "./HostPhotos";
import * as api from "../../services/hostApi";
jest.mock("../../services/hostApi");
const hotel = { id: 2, name: "Test Hotel", status: "DRAFT" };
const first = { id: 10, url: "/api/media/10", altText: "Lobby", width: 800, height: 600 };
const second = { ...first, id: 11, url: "/api/media/11", altText: "Pool" };
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  URL.createObjectURL = jest.fn(() => "blob:preview"); URL.revokeObjectURL = jest.fn();
});
beforeEach(() => { jest.clearAllMocks(); api.getHostRooms.mockResolvedValue([{ id: 5, name: "King", active: true }]); api.getHostImages.mockResolvedValue([first, second]); api.uploadHostImage.mockResolvedValue(first); api.orderHostImages.mockResolvedValue([second, first]); api.deleteHostImage.mockResolvedValue(null); });
test("uploads a hotel photo and rejects oversized files before calling API", async () => {
  render(<HostPhotos hotel={hotel} onRoomChange={jest.fn()} onNotify={jest.fn()} />);
  await screen.findByText("Cover photo");
  const file = new File(["png"], "room.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Choose photo"), { target: { files: [file] } });
  fireEvent.change(screen.getByLabelText("Photo description"), { target: { value: "Our lobby" } });
  fireEvent.click(screen.getByRole("button", { name: "Upload photo" }));
  await waitFor(() => expect(api.uploadHostImage).toHaveBeenCalledWith(2, undefined, file, "Our lobby"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Upload photo" })).toBeDisabled());
  const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "huge.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Choose photo"), { target: { files: [huge] } });
  expect(screen.getByRole("alert")).toHaveTextContent("up to 5 MB"); expect(api.uploadHostImage).toHaveBeenCalledTimes(1);
});
test("sets cover using the full collection and confirms deletion", async () => {
  render(<HostPhotos hotel={hotel} roomId="5" onRoomChange={jest.fn()} onNotify={jest.fn()} />);
  await screen.findByText("Cover photo");
  fireEvent.click(screen.getAllByRole("button", { name: "Set cover" })[1]);
  await waitFor(() => expect(api.orderHostImages).toHaveBeenCalledWith(2, "5", [11, 10]));
  await waitFor(() => expect(screen.getAllByRole("button", { name: "Delete" })[0]).toBeEnabled());
  fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]);
  expect(api.deleteHostImage).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete photo" }));
  await waitFor(() => expect(api.deleteHostImage).toHaveBeenCalledWith(2, 10));
});
test("archived hotels are read only and collection changes are explicit", async () => {
  const onRoomChange = jest.fn(); render(<HostPhotos hotel={{ ...hotel, status: "ARCHIVED" }} onRoomChange={onRoomChange} />);
  await screen.findByText("Cover photo");
  expect(screen.queryByLabelText("Choose photo")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Photo collection" }), { target: { value: "5" } }); expect(onRoomChange).toHaveBeenCalledWith("5");
});
