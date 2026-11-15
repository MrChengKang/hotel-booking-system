import { act, render, screen, waitFor } from "@testing-library/react";
import { NotificationsProvider, useNotifications } from "./NotificationsContext";
import { useAuth } from "./AuthContext";
import * as api from "../services/notificationApi";
jest.mock("./AuthContext"); jest.mock("../services/notificationApi");
function Count() { const inbox = useNotifications(); return <p>{inbox.unreadCount} unread</p>; }
test("changing accounts hides the previous unread count immediately and ignores late results", async () => {
  let user = { id: 1 }, finish;
  useAuth.mockImplementation(() => ({ user })); api.getUnreadCount.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValue({ unreadCount: 0 });
  const view = render(<NotificationsProvider><Count /></NotificationsProvider>); await waitFor(() => expect(api.getUnreadCount).toHaveBeenCalledTimes(1));
  user = { id: 2 }; view.rerender(<NotificationsProvider><Count /></NotificationsProvider>); await waitFor(() => expect(api.getUnreadCount).toHaveBeenCalledTimes(2)); await act(async () => { finish({ unreadCount: 9 }); }); expect(screen.getByText("0 unread")).toBeInTheDocument();
});
test("logout immediately clears the unread badge", async () => {
  let user = { id: 1 }; useAuth.mockImplementation(() => ({ user })); api.getUnreadCount.mockResolvedValue({ unreadCount: 3 }); const view = render(<NotificationsProvider><Count /></NotificationsProvider>); await screen.findByText("3 unread"); user = null; view.rerender(<NotificationsProvider><Count /></NotificationsProvider>); expect(screen.getByText("0 unread")).toBeInTheDocument();
});
