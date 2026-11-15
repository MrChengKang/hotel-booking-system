import { useTranslation } from "../../i18n";
import { useEffect, useRef } from "react";
import Icon from "../common/Icon";
import { useAuth } from "../../context/AuthContext";
import "./ProfileDialog.css";

const titles = { account: "My Account", bookings: "My Bookings", help: "How can we help?" };

export default function ProfileDialog({ view, onClose, onFindHotel }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="profile-dialog"
      aria-label={t(titles[view])}
      onCancel={onClose}
      onClick={(event) => { if (event.target === dialog.current) onClose(); }}
    >
      <div className="profile-dialog-heading"><h2>{t(titles[view])}</h2><button onClick={onClose} aria-label={t("Close account panel")}>×</button></div>
      {view === "account" && (
        <div className="account-details">
          
          <p className="account-demo-label">{t("STAY account")}</p>
          <dl><div><dt>{t("Name")}</dt><dd>{user?.name}</dd></div><div><dt>{t("Email")}</dt><dd>{user?.email}</dd></div><div><dt>{t("Role")}</dt><dd>{user?.role === "host" ? t("Hotel Host") : user?.role === "admin" ? t("Admin") : t("User")}</dd></div></dl>
        </div>
      )}
      {view === "bookings" && (
        <div className="booking-empty"><Icon name="clipboard" size={44} /><h3>{t("No hotel bookings yet")}</h3><p>{t("Your confirmed stays will appear here once booking is connected.")}</p><button className="dark-button" onClick={() => { onClose(); onFindHotel(); }}>{t("Find a hotel")}</button></div>
      )}
      {view === "help" && (
        <div className="profile-help">
          <details open><summary>{t("How do I choose my dates?")}</summary><p>{t("Open the date calendar, choose your check-in date, then your check-out date.")}</p></details>
          <details><summary>{t("Where can I find my saved hotels?")}</summary><p>{t("Tap a hotel’s heart button, then open Wishlist from your profile menu.")}</p></details>
          <details><summary>{t("Can I book a room here?")}</summary><p>{t("Open a published hotel, choose your room and dates, then confirm a reservation. Pay with a Stripe test card in My Bookings. This sandbox never charges real money.")}</p></details>
        </div>
      )}
    </dialog>
  );
}
