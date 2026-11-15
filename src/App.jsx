import { useTranslation } from "./i18n";
import { useCallback, useRef, useState } from "react";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Hero from "./components/home/Hero";
import BookingSearch from "./components/home/BookingSearch";
import Destinations from "./components/home/Destinations";
import Benefits from "./components/home/Benefits";
import Toast from "./components/common/Toast";
import HowItWorks from "./components/home/HowItWorks";
import PlanYourStay from "./components/home/PlanYourStay";
import StayCollections from "./components/home/StayCollections";
import GuestReviewHighlights from "./components/home/GuestReviewHighlights";
import { HotelDestinationsProvider } from "./context/HotelDestinationsContext";
import { PreferencesProvider } from "./context/PreferencesContext";
import AccountPage from "./components/account/AccountPage";
import SavedHotels from "./components/account/SavedHotels";
import NotificationsPage from "./components/notifications/NotificationInbox";
import { NotificationsProvider } from "./context/NotificationsContext";
import { FavoritesProvider, useFavorites } from "./context/FavoritesContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import useDestinationRoute from "./hooks/useDestinationRoute";
import AuthPage from "./components/auth/AuthPage";
import PasswordRecoveryPage from "./components/auth/PasswordRecoveryPage";
import LiveHotelList from "./components/live/LiveHotelList";
import HotelSearchForm from "./components/live/HotelSearchForm";
import LiveHotelDetail from "./components/live/LiveHotelDetail";
import MyBookings from "./components/live/MyBookings";
import HostDashboard from "./components/host/HostDashboard";
import AdminDashboard from "./components/admin/AdminDashboard";
import {
  loginDestination,
  safeReturnPath,
  stayParams,
} from "./utils/liveBooking";
import { countGuests } from "./utils/guests";

export default function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <NotificationsProvider>
          <FavoritesProvider>
            <HotelHomepage />
          </FavoritesProvider>
        </NotificationsProvider>
      </AuthProvider>
    </PreferencesProvider>
  );
}
function HotelHomepage() {
  const { t } = useTranslation();
  const route = useDestinationRoute();
  const { navigatePath } = route;
  const [location, setLocation] = useState("");
  const [panel, setPanel] = useState(null);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const favorites = useFavorites();
  const savedHotels = favorites.savedHotels;
  const locationInput = useRef(null);
  const onLogin = useCallback(
    (next) =>
      navigatePath(`/login?next=${encodeURIComponent(safeReturnPath(next))}`),
    [navigatePath],
  );
  const browse = () => {
    navigatePath("/hotels");
  };
  function focusSearch() {
    if (route.kind === "hotel") {
      document
        .getElementById("hotel-reservation")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (route.kind !== "home") {
      browse();
      return;
    }
    locationInput.current?.focus();
    locationInput.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
  function searchHotels(value) {
    setPanel(null);
    navigatePath(
      `/hotels?${stayParams({ city: value.location.trim(), checkIn: value.checkIn, checkOut: value.checkOut, rooms: 1, guests: countGuests(value.guests) })}`,
    );
  }
  function openHotel(hotel, search = {}) {
    navigatePath(
      `/hotel/${hotel.id}${Object.keys(search).length ? `?${stayParams(search)}` : ""}`,
    );
  }
  async function toggleSaved(hotel) {
    if (!user) {
      onLogin(`/hotel/${hotel.id}`);
      setMessage(t("Sign in to save hotels to your account."));
      return;
    }
    if (!favorites.ready) {
      setMessage(
        favorites.resource.error?.message ||
          t("Your saved hotels are loading. Please try again shortly."),
      );
      return;
    }
    const save = !favorites.isSaved(hotel.id);
    try {
      await favorites.setSaved(hotel.id, save);
      setMessage(
        save
          ? t("Hotel saved to your account.")
          : t("Hotel removed from saved hotels."),
      );
    } catch (error) {
      setMessage(error.message);
    }
  }
  function wishlist() {
    navigatePath("/wishlist");
  }
  function authNavigate(path) {
    const next = safeReturnPath(route.params.get("next"));
    navigatePath(
      (path === "/login" || path === "/register") && next !== "/"
        ? `${path}?next=${encodeURIComponent(next)}`
        : path,
    );
  }
  const search = Object.fromEntries(
    ["checkIn", "checkOut", "rooms", "guests", "currency", "minPrice", "maxPrice", "minBeds", "amenities", "sort", "page"]
      .filter((key) => route.params.has(key))
      .map((key) => [key, route.params.get(key)]),
  );
  return (
    <>
      <Header
        onNavigate={navigatePath}
        onAccount={() => navigatePath("/account")}
        onSignedOut={() => navigatePath("/login")}
        onAuth={() =>
          onLogin(
            route.kind === "hotel" ||
              route.kind === "bookings" ||
              route.kind === "host" || route.kind === "admin"
              ? route.path
              : "/",
          )
        }
        onFindHotel={focusSearch}
        onNotify={setMessage}
        onWishlist={wishlist}
        onBookings={() => navigatePath("/bookings")}
        onHost={() => navigatePath("/host")}
        onAdmin={() => navigatePath("/admin")}
      />
      <main>
        {route.kind === "auth" ? (
          route.authMode.includes("password") ? (
            <PasswordRecoveryPage
              key={route.authMode}
              mode={route.authMode}
              onNavigate={navigatePath}
            />
          ) : (
            <AuthPage
              key={route.authMode}
              mode={route.authMode}
              onNavigate={authNavigate}
              onSuccess={(user) => {
                navigatePath(
                  loginDestination(user?.role, route.params.get("next")),
                );
                setMessage(t("You are signed in."));
              }}
            />
          )
        ) : route.kind === "notifications" ? (
          <NotificationsPage onLogin={onLogin} onNavigate={navigatePath} />
        ) : route.kind === "account" ? (
          <AccountPage
            onLogin={onLogin}
            onNotify={setMessage}
            onWishlist={wishlist}
          />
        ) : route.kind === "wishlist" ? (
          <SavedHotels
            onLogin={onLogin}
            onBrowse={browse}
            onOpenHotel={openHotel}
            onNotify={setMessage}
          />
        ) : route.kind === "admin" ? (
          <AdminDashboard view={route.adminView} params={route.params} onNavigate={navigatePath} onLogin={onLogin} onNotify={setMessage} />
        ) : route.kind === "host" ? (
          <HostDashboard
            view={route.hostView}
            params={route.params}
            onNavigate={navigatePath}
            onLogin={onLogin}
            onNotify={setMessage}
          />
        ) : route.kind === "hotel" ? (
          <LiveHotelDetail
            key={route.hotelId}
            id={route.hotelId}
            params={route.params}
            onBack={browse}
            onLogin={onLogin}
            onBooked={(result) => {
              navigatePath(`/bookings?booking=${result.booking.id}`);
              setMessage(
                t("Reservation {{reference}} created. Continue to My Bookings to check its status.", { reference: result.booking.reference }),
              );
            }}
            savedHotels={savedHotels}
            onToggleSaved={toggleSaved}
            savingIds={favorites.pending}
          />
        ) : route.kind === "bookings" ? (
          <MyBookings
            key={route.path}
            params={route.params}
            onLogin={onLogin}
            onBrowse={browse}
            onNotify={setMessage}
          />
        ) : route.kind === "hotels" ? (
          <>
            <div className="container live-catalogue-heading">
              <button className="city-back" onClick={() => navigatePath("/")}>{t("← Home")}</button>
              <h1>{t("Find your hotel")}</h1>
              <HotelSearchForm key={route.path} city={route.city} search={search}
                onSearch={values => navigatePath(`/hotels?${stayParams(values)}`)} onClear={browse} />
            </div>
            <LiveHotelList
              key={JSON.stringify([route.city, search])}
              city={route.city}
              search={search}
              onPageChange={page => navigatePath(`/hotels?${stayParams({ city: route.city, ...search, page })}`)}
              savedHotels={savedHotels}
              onSavedOnlyChange={(value) => {
                if (value) wishlist();
              }}
              onToggleSaved={toggleSaved}
              savingIds={favorites.pending}
              onOpenHotel={openHotel}
            />
          </>
        ) : route.kind === "home" ? (
          <HotelDestinationsProvider>
            <Hero onStartSearch={focusSearch}>
              <BookingSearch
                location={location}
                onLocationChange={setLocation}
                locationInput={locationInput}
                panel={panel}
                onPanelChange={setPanel}
                onNotify={setMessage}
                onSearch={searchHotels}
              />
            </Hero>
            <Destinations onSelectDestination={city => navigatePath(`/hotels?${stayParams({ city })}`)} onBrowseAll={browse} />
            <Benefits />
            <LiveHotelList
              savedHotels={savedHotels}
              onSavedOnlyChange={(value) => {
                if (value) wishlist();
              }}
              onToggleSaved={toggleSaved}
              savingIds={favorites.pending}
              onOpenHotel={openHotel}
              onBrowseAll={browse}
            />
            <HowItWorks />
            <StayCollections onNavigate={navigatePath} />
            <GuestReviewHighlights onNavigate={navigatePath} />
            <PlanYourStay user={user} onNavigate={navigatePath} />
          </HotelDestinationsProvider>
        ) : (
          <section className="container live-bookings">
            <h1>{t("Page not found")}</h1>
            <button className="dark-button" onClick={browse}>{t("Browse hotels")}</button>
          </section>
        )}
      </main>
      <Footer user={user} onNavigate={navigatePath} />
      <Toast message={message} onClose={() => setMessage("")} />
    </>
  );
}
