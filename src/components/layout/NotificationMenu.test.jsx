import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NotificationMenu from "./NotificationMenu";
import { NotificationsProvider } from "../../context/NotificationsContext";
import { useAuth } from "../../context/AuthContext";
import * as api from "../../services/notificationApi";
jest.mock("../../context/AuthContext");
jest.mock("../../services/notificationApi", () => ({ ...jest.requireActual("../../services/notificationApi"), getUnreadCount: jest.fn(), getNotifications: jest.fn(), markNotificationRead: jest.fn(), markAllNotificationsRead: jest.fn() }));
let items;
beforeEach(() => {
 jest.clearAllMocks(); useAuth.mockReturnValue({ user: { id: 1 } });
 items = [{ id: 7, title: "Booking confirmed", message: "City Hotel", target: "/bookings?booking=4", createdAt: "2026-11-01T00:00:00Z", readAt: null }];
 api.getUnreadCount.mockImplementation(async () => ({ unreadCount: items.filter(item => !item.readAt).length }));
 api.getNotifications.mockImplementation(async () => ({ items: items.map(item => ({ ...item })), page: 0, totalPages: 1 }));
 api.markNotificationRead.mockImplementation(async id => { items = items.map(item => item.id === id ? { ...item, readAt: "2026-11-02T00:00:00Z" } : item); });
 api.markAllNotificationsRead.mockImplementation(async () => { items = items.map(item => ({ ...item, readAt: "2026-11-02T00:00:00Z" })); });
});
function open(onNavigate = jest.fn(), onAuth = jest.fn()) { render(<NotificationsProvider><NotificationMenu onNavigate={onNavigate} onAuth={onAuth} /></NotificationsProvider>); return screen.getByRole("button", { name: "Notifications", exact: true }); }
test("loads actual unread notifications and marks selected item before navigation", async () => {
 const onNavigate = jest.fn(), trigger = open(onNavigate); await waitFor(() => expect(trigger).toHaveAccessibleDescription("1 unread notifications")); fireEvent.click(trigger);
 fireEvent.click(await screen.findByRole("button", { name: /Booking confirmed:.*Unread/ })); await waitFor(() => expect(onNavigate).toHaveBeenCalledWith("/bookings?booking=4")); expect(api.markNotificationRead).toHaveBeenCalledWith(7); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
 fireEvent.click(trigger); expect(await screen.findByRole("button", { name: /Booking confirmed:.*Read\./ })).toBeInTheDocument();
});
test("supports mark all, keyboard escape and outside dismissal", async () => {
 const trigger = open(); fireEvent.keyDown(trigger, { key: "ArrowDown" }); const mark = await screen.findByRole("button", { name: "Mark all as read" }); fireEvent.click(mark); await waitFor(() => expect(api.markAllNotificationsRead).toHaveBeenCalledTimes(1));
 await waitFor(() => expect(trigger).toHaveAccessibleDescription("0 unread notifications")); fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" }); expect(trigger).toHaveFocus(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
 fireEvent.click(trigger); fireEvent.pointerDown(document.body); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
test("read failures keep the notification unread and do not navigate", async () => {
 api.markNotificationRead.mockRejectedValueOnce(new Error("Try again later")); const onNavigate = jest.fn(), trigger = open(onNavigate); fireEvent.click(trigger); fireEvent.click(await screen.findByRole("button", { name: /Booking confirmed:.*Unread/ })); expect(await screen.findByRole("alert")).toHaveTextContent("Try again later"); expect(onNavigate).not.toHaveBeenCalled();
});
test("anonymous visitors see sign in instead of fabricated notifications", () => {
 useAuth.mockReturnValue({ user: null }); const onAuth = jest.fn(), trigger = open(jest.fn(), onAuth); fireEvent.click(trigger); expect(onAuth).toHaveBeenCalled(); expect(api.getNotifications).not.toHaveBeenCalled(); expect(api.getUnreadCount).not.toHaveBeenCalled();
});
