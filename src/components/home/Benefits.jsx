import { useTranslation } from "../../i18n";
import { photo } from "../../utils/images";
import "./Benefits.css";

export default function Benefits() {
  const { t } = useTranslation();
  return (
    <section className="benefits container" id="benefits">
      <img className="hotel-benefits-image" src={photo("photo-1566073771259-6a8506099945")} alt={t("A hotel pool surrounded by palm trees")} loading="lazy" />
      <div className="benefits-copy">
        <p className="eyebrow">{t("BENEFITS")}</p>
        <h2>{t("Why book your hotel with us?")}</h2>
        <article>
          <span className="badge gray">{t("Choice")}</span>
          <h3>{t("A hotel for every stay")}</h3>
          <p>{t("Explore hotel rooms for city breaks, business trips and relaxing holidays.")}</p>
        </article>
        <article>
          <span className="badge green">{t("Clarity")}</span>
          <h3>{t("Know the price before you book")}</h3>
          <p>{t("Compare nightly rates and room details to choose the right hotel for your budget.")}</p>
        </article>
        <article>
          <span className="badge red">{t("Confidence")}</span>
          <h3>{t("Choose with guest reviews")}</h3>
          <p>{t("Read hotel ratings and guest feedback to find a stay that feels right for you.")}</p>
        </article>
      </div>
    </section>
  );
}
