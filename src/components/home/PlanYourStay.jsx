import { useTranslation } from "../../i18n";
import { PlanningIllustration } from "./illustrations/HomeIllustrations";
import RouteLink from "../common/RouteLink";
import "./HomeSections.css";
import "./PlanYourStay.css";

export default function PlanYourStay({ user, onNavigate }) {
  const { t } = useTranslation();
  return <section className="plan-stay container" aria-labelledby="plan-stay-title">
    <div className="plan-stay-copy"><span className="collections-eyebrow">{t("Your personal shortlist")}</span><h2 id="plan-stay-title">{t("Good stays are worth saving")}</h2><p>{t("Keep hotels you like in one place, then return when you are ready to choose your dates.")}</p>
      <ul>{["Save hotels using the heart button", "Find your shortlist in Saved hotels", "Check current rooms and prices before booking"].map((text, index) => <li key={text}><span aria-hidden="true">0{index + 1}</span>{t(text)}</li>)}</ul>
      <div className="plan-stay-actions"><RouteLink className="dark-button" href={user ? "/wishlist" : "/login?next=%2Fwishlist"} onNavigate={onNavigate}>{t(user ? "View saved hotels" : "Sign in to save hotels")}</RouteLink><RouteLink className="plan-browse" href="/hotels" onNavigate={onNavigate}>{t("Browse hotels")}<span aria-hidden="true">↗</span></RouteLink></div>
    </div><PlanningIllustration />
  </section>;
}
