import { useTranslation } from "../../i18n";
import { useEffect, useRef, useState } from "react";
import Icon from "../common/Icon";
import { useNotifications } from "../../context/NotificationsContext";
import { NotificationInbox } from "../notifications/NotificationInbox";
import "./NotificationMenu.css";

export default function NotificationMenu({ onNavigate, onAuth }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false), inbox = useNotifications();
  const container = useRef(null), trigger = useRef(null), panel = useRef(null);
  useEffect(() => { setOpen(false); }, [inbox.user?.id]);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector("button")?.focus();
    const dismiss = event => { if (!container.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("pointerdown", dismiss); return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  function close() { setOpen(false); trigger.current?.focus(); }
  function handleKey(event) {
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); const items = [...panel.current.querySelectorAll("button:not(:disabled)")];
    const current = items.indexOf(document.activeElement), index = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[index]?.focus();
  }
  return <div ref={container} className="notification-control" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}><button ref={trigger} className="notification" aria-label={t("Notifications")} aria-describedby="notification-unread-count" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? "notifications-panel" : undefined} onClick={() => { if (!inbox.user) onAuth(); else { if (!open) inbox.refresh(); setOpen(value => !value); } }} onKeyDown={event => { if (event.key === "ArrowDown") { event.preventDefault(); if (!inbox.user) onAuth(); else setOpen(true); } }}><Icon name="bell" />{inbox.unreadCount > 0 && <i aria-hidden="true" />}</button><span id="notification-unread-count" className="notification-sr-only" aria-live="polite">{inbox.user ? inbox.count.status === "error" ? t("Unread count unavailable") : t("{{count}} unread notifications", { count: inbox.unreadCount }) : t("Sign in to see notifications")}</span>{open && inbox.user && <div ref={panel} id="notifications-panel" className="notification-popover" role="dialog" aria-labelledby="notifications-title" onKeyDown={handleKey}><NotificationInbox compact onNavigate={onNavigate} onSelected={close} /></div>}</div>;
}
