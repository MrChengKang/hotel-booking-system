import { useTranslation } from "../../i18n";
import { useEffect, useRef, useState } from "react";
import UserAvatar from "../common/UserAvatar";
import Icon from "../common/Icon";
import useTheme from "../../hooks/useTheme";
import { useAuth } from "../../context/AuthContext";
import "./ProfileMenu.css";

export default function ProfileMenu({ onAction, onNotify, onAuth, onSignedOut = () => {} }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const auth = useAuth();
  const user = auth?.user;
  const container = useRef(null);
  const trigger = useRef(null);
  const menu = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!open) return;
    menu.current.querySelector('[role="menuitem"]')?.focus();
    function dismiss(event) {
      if (!container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function select(action) {
    close();
    onAction(action);
  }

  function handleKey(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...menu.current.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"]')];
    const current = items.indexOf(document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }

  if (auth?.loading) return <button className="profile-sign-in" disabled>{t("Checking account…")}</button>;
  if (!user) {
    return <button
      className="profile-sign-in"
      onClick={onAuth}
    >{t("Sign in")}</button>;
  }

  return (
    <div
      className="profile-control"
      ref={container}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    >
      <button
        ref={trigger}
        className="avatar"
        aria-label={t("Your account")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? "profile-menu" : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }}
      >
        <UserAvatar user={user} className="profile-initials" />
      </button>
      {open && (
        <div
          id="profile-menu"
          ref={menu}
          className="profile-menu"
          role="menu"
          aria-label={t("Profile menu")}
          onKeyDown={handleKey}
        >
          <div className="profile-identity" role="presentation">
            <UserAvatar user={user} className="profile-initials" />
            <div><strong>{user.name}</strong><span>{user.role === "host" ? t("Hotel Host") : user.role === "admin" ? t("Admin") : t("User")}</span></div>
          </div>
          <button role="menuitem" onClick={() => select("account")}><Icon name="user" /><span>{t("My Account")}</span></button>
          {user.role === "admin" ? <button role="menuitem" onClick={() => select("admin")}><Icon name="clipboard" /><span>{t("Admin Dashboard")}</span></button> : user.role === "host" ? <button role="menuitem" onClick={() => select("host")}><Icon name="clipboard" /><span>{t("Host Dashboard")}</span></button> : <button role="menuitem" onClick={() => select("bookings")}><Icon name="clipboard" /><span>{t("My Bookings")}</span></button>}
          <button role="menuitem" onClick={() => select("wishlist")}><Icon name="heart" /><span>{t("Wishlist")}</span></button>
          <div className="profile-menu-divider" role="separator" />
          <button role="menuitemcheckbox" aria-checked={theme === "dark"} onClick={toggleTheme}>
            <Icon name="bulb" /><span>{t("Dark theme")}</span>
            <span className={`theme-toggle${theme === "dark" ? " is-dark" : ""}`} aria-hidden="true">
              <span className="theme-toggle-sun"><Icon name="sun" size={18} /></span>
              <span className="theme-toggle-moon"><Icon name="moon" size={18} /></span>
            </span>
          </button>
          <button role="menuitem" onClick={() => select("help")}><Icon name="help" /><span>{t("Help")}</span></button>
          <button
            role="menuitem"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              try { await auth.logout(); setOpen(false); onNotify(t("You have signed out.")); onSignedOut(); }
              catch (error) { onNotify(error.message); }
              finally { setSigningOut(false); }
            }}
          ><Icon name="logout" /><span>{signingOut ? t("Signing out…") : t("Log out")}</span></button>
        </div>
      )}
    </div>
  );
}
