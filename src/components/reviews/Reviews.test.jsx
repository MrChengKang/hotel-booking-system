import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import BookingReview from "./BookingReview";
import HotelReviews from "./HotelReviews";
import HostReviews from "../host/HostReviews";
import * as api from "../../services/reviewApi";
import { useAuth } from "../../context/AuthContext";
jest.mock("../../services/reviewApi"); jest.mock("../../context/AuthContext");
const review = { id: 2, authorName: "Alex", rating: 4, comment: "Quiet room", createdAt: "2026-11-01T00:00:00Z", updatedAt: "2026-11-01T00:00:00Z", hostReply: null };
const listing = { summary: { reviewCount: 1, averageRating: 4 }, reviews: { items: [review], page: 0, totalPages: 1 } };
beforeAll(() => { HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); }; HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); }; });
beforeEach(() => { jest.clearAllMocks(); useAuth.mockReturnValue({ user: { id: 1, role: "user" } }); api.getBookingReview.mockResolvedValue({ eligible: true, review: null }); api.getHotelReviews.mockResolvedValue(listing); api.getHostReviews.mockResolvedValue(listing); api.replyToReview.mockResolvedValue({ ...review, hostReply: "Thank you" }); });
test("future bookings show the server's eligibility explanation", async () => {
  api.getBookingReview.mockResolvedValue({ eligible: false, reason: "Available after local check-out date." }); render(<BookingReview bookingId={7} />); expect(await screen.findByText("Available after local check-out date.")).toBeInTheDocument(); expect(screen.queryByRole("form")).not.toBeInTheDocument();
});
test("eligible guest submits rating/comment then sees their saved review", async () => {
  api.saveBookingReview.mockImplementation(async () => { api.getBookingReview.mockResolvedValue({ eligible: true, review }); return review; }); render(<BookingReview bookingId={7} />);
  fireEvent.change(await screen.findByLabelText("Rating"), { target: { value: "4" } }); fireEvent.change(screen.getByLabelText("Your experience"), { target: { value: "Quiet room" } }); fireEvent.submit(screen.getByRole("form", { name: "Hotel review" }));
  expect(await screen.findByRole("button", { name: "Edit your review" })).toBeInTheDocument(); expect(screen.getByText("Quiet room")).toBeInTheDocument(); expect(api.saveBookingReview).toHaveBeenCalledWith(7, { rating: 4, comment: "Quiet room" });
});
test("review save failure preserves the entered comment", async () => {
  api.saveBookingReview.mockRejectedValue(new Error("Not eligible")); render(<BookingReview bookingId={7} />); fireEvent.change(await screen.findByLabelText("Your experience"), { target: { value: "My experience" } }); fireEvent.submit(screen.getByRole("form", { name: "Hotel review" })); expect(await screen.findByRole("alert")).toHaveTextContent("Not eligible"); expect(screen.getByLabelText("Your experience")).toHaveValue("My experience");
});
test("public reviews display backend summary and hotel reply", async () => {
  api.getHotelReviews.mockResolvedValue({ ...listing, reviews: { ...listing.reviews, items: [{ ...review, hostReply: "Welcome back", repliedAt: "2026-11-02T00:00:00Z" }] } }); render(<HotelReviews hotelId={4} />); expect(await screen.findByText("4 / 5")).toBeInTheDocument(); expect(screen.getByText("Welcome back")).toBeInTheDocument(); expect(screen.getByLabelText("4 out of 5 stars")).toBeInTheDocument();
});
test("host replies through the selected hotel's API", async () => {
  render(<HostReviews hotel={{ id: 4, name: "City Hotel", status: "PUBLISHED" }} onNotify={jest.fn()} />); fireEvent.click(await screen.findByRole("button", { name: "Reply to guest" })); fireEvent.change(screen.getByLabelText("Your response"), { target: { value: "Thank you" } }); fireEvent.click(screen.getByRole("button", { name: "Publish response" })); await waitFor(() => expect(api.replyToReview).toHaveBeenCalledWith(4, 2, "Thank you"));
});
