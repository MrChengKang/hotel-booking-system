import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PlanYourStay from "./PlanYourStay";
import StayCollections from "./StayCollections";
import GuestReviewHighlights from "./GuestReviewHighlights";
import { getReviewHighlights } from "../../services/reviewApi";
import i18n from "../../i18n";
jest.mock("../../services/reviewApi");
beforeEach(() => { jest.clearAllMocks(); i18n.changeLanguage("en-US"); getReviewHighlights.mockResolvedValue([]); });

test("replaces the email preview with a working sign-in and saved-hotels path", () => {
  const navigate = jest.fn();render(<PlanYourStay onNavigate={navigate} />);
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  const link=screen.getByRole("link",{name:"Sign in to save hotels"});
  expect(link).toHaveAttribute("href","/login?next=%2Fwishlist");
  fireEvent.click(link);expect(navigate).toHaveBeenCalledWith("/login?next=%2Fwishlist");
  expect(screen.getByRole("link",{name:/Browse hotels/})).toHaveAttribute("href","/hotels");
  expect(screen.queryByText(/discount|newsletter/i)).not.toBeInTheDocument();
});
test.each(["user","host","admin"])("%s can open the actual shortlist",role=>{
  render(<PlanYourStay user={{role}} />);
  expect(screen.getByRole("link",{name:"View saved hotels"})).toHaveAttribute("href","/wishlist");
});
test("room collections apply actual occupancy and bed filters without mapping them to invented destinations",()=>{
  const navigate=jest.fn();render(<StayCollections onNavigate={navigate} />);
  fireEvent.click(screen.getByRole("link",{name:/Travelling together/}));
  expect(navigate).toHaveBeenCalledWith("/hotels?rooms=2&guests=4");
  expect(screen.getByRole("link",{name:/Prefer separate beds/})).toHaveAttribute("href","/hotels?rooms=1&guests=2&minBeds=2");
  expect(screen.queryByText(/Boutique hotels|Maldives|Luxury hotels/)).not.toBeInTheDocument();
});
test("empty review data removes the section instead of inventing guests or stars",async()=>{
  const {container}=render(<GuestReviewHighlights />);
  await waitFor(()=>expect(getReviewHighlights).toHaveBeenCalledTimes(1));
  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByText(/Sofia|Sample story|Illustrative/)).not.toBeInTheDocument();
});
test("real reviews keep the actual text, low rating and current hotel's link",async()=>{
  getReviewHighlights.mockResolvedValue([{id:9,authorName:"Actual Guest",rating:2,comment:"The room was clean but the street was noisy.",createdAt:"2026-11-10T10:00:00Z",hotelId:42,hotelName:"API Hotel",city:"Raub"}]);
  const navigate=jest.fn();render(<GuestReviewHighlights onNavigate={navigate} />);
  expect(await screen.findByRole("heading",{name:"Recent guest reviews"})).toBeInTheDocument();
  expect(screen.getByRole("blockquote")).toHaveTextContent("The room was clean but the street was noisy.");
  expect(screen.getByLabelText("2 out of 5 stars")).toBeInTheDocument();
  expect(screen.getByText("Actual Guest")).toBeInTheDocument();
  const hotel=screen.getByRole("link",{name:/API Hotel/});expect(hotel).toHaveAttribute("href","/hotel/42");
  fireEvent.click(hotel);expect(navigate).toHaveBeenCalledWith("/hotel/42");
});
test("failed review requests can be retried without replacing the content with examples",async()=>{
  getReviewHighlights.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce([]);
  const {container}=render(<GuestReviewHighlights />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
  fireEvent.click(screen.getByRole("button",{name:"Try again"}));
  await waitFor(()=>expect(container).toBeEmptyDOMElement());
  expect(getReviewHighlights).toHaveBeenCalledTimes(2);
});

test.each([400,404])("an older backend without the optional review endpoint (%s) leaves the homepage usable",async status=>{
  getReviewHighlights.mockRejectedValue(Object.assign(new Error("Endpoint unavailable"),{status}));
  const {container}=render(<GuestReviewHighlights />);
  await waitFor(()=>expect(getReviewHighlights).toHaveBeenCalledTimes(1));
  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
