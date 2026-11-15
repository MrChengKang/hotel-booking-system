import { useTranslation } from "../../i18n";
import { photo } from "../../utils/images";
import "./Hero.css";

export default function Hero({ children, onStartSearch }) {
  const { t } = useTranslation();
  return (
    <section className="hero container">
      <div className="hero-glow" />
      <div className="hero-copy">
        <p className="eyebrow mobile-eyebrow">{t("YOUR PERFECT HOTEL STARTS HERE")}</p>
        <h1>{t("Find your")}<br />{t("perfect hotel.")}</h1>
        <p className="hero-subtitle">{t("Discover great hotels for your next stay.")}</p>
        <button
          className="dark-button"
          onClick={onStartSearch}
        >{t("Find your hotel")}</button>
      </div>
      <div className="hero-images">
        <img
          className="hero-top"
          src={photo("photo-1514282401047-d79a71a590e8")}
          alt={t("An overwater resort hotel in the Maldives")}
        />
        <img
          className="hero-bottom"
          src={photo("photo-1571896349842-33c89424de2d")}
          alt={t("A peaceful resort swimming pool")}
        />
        <img
          className="hero-tall"
          src={photo("photo-1537996194471-e657df975ab4")}
          alt={t("A scenic tropical escape in Bali")}
        />
      </div>
      {children}
    </section>
  );
}
