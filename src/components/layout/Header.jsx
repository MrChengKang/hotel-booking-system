import { useTranslation } from "../../i18n";
import { useState } from "react";
import Icon from "../common/Icon";
import Logo from "../common/Logo";
import ProfileMenu from "./ProfileMenu";
import ProfileDialog from "./ProfileDialog";
import NotificationMenu from "./NotificationMenu";
import RegionalMenu from "./RegionalMenu";
import "./Header.css";

export default function Header({ onFindHotel, onNotify, onWishlist, onAuth, onBookings, onHost, onAdmin, onSignedOut, onAccount, onNavigate }) {
  const { t } = useTranslation();
  const [accountView, setAccountView] = useState(null);

  function handleProfileAction(action) {
    if (action === "account" && onAccount) onAccount();
    else if (action === "host") onHost();
    else if (action === "admin") onAdmin();
    else if (action === "bookings") onBookings();
    else if (action === "wishlist") onWishlist();
    else setAccountView(action);
  }

  return (
    <header id="home" className="header container">
      <div className="nav-start">
        <Logo />
        <span className="nav-divider" />
        <a className="hotel-nav-link" href="/#featured-stays-title">{t("Hotels")}</a>
      </div>
      <nav className="nav-end" aria-label={t("Main navigation")}>
        <a className="templates" href="/#destinations">{t("Explore")}<Icon name="down" size={15} />
        </a>
        <RegionalMenu />
        <button className="outline-button" onClick={onFindHotel}>{t("Find a hotel")}</button>
        <NotificationMenu onNavigate={onNavigate} onAuth={onAuth} />
        <ProfileMenu onAuth={onAuth} onAction={handleProfileAction} onNotify={onNotify} onSignedOut={onSignedOut} />
      </nav>
      {accountView && <ProfileDialog view={accountView} onClose={() => setAccountView(null)} onFindHotel={onFindHotel} />}
    </header>
  );
}
