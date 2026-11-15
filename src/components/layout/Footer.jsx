import { useState } from "react";
import { useTranslation } from "../../i18n";
import { getFooterGroups } from "../../data/navigation";
import Logo from "../common/Logo";
import Icon from "../common/Icon";
import FooterHelp from "./FooterHelp";
import "./Footer.css";

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export default function Footer({ user = null, onNavigate }) {
  const { t } = useTranslation();
  const [topic, setTopic] = useState(null);
  const year = new Date().getFullYear();

  function follow(event, href) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (href.startsWith("/#")) {
      const target = document.getElementById(href.slice(2));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion() ? "instant" : "smooth", block: "start" });
      }
      // On other pages the real URL navigates home and honors its section anchor.
      return;
    }
    if (onNavigate) { event.preventDefault(); onNavigate(href); }
  }

  return <footer className="site-footer" id="site-footer">
    <div className="footer-main container">
      <div className="footer-brand">
        <Logo />
        <p>{t("Find your perfect hotel and book in a few steps —")} {t("with the total shown before you pay.")}</p>
        <a className="footer-browse" href="/hotels" onClick={event => follow(event, "/hotels")}>{t("Explore hotels")}<span aria-hidden="true">↗</span></a>
      </div>
      {getFooterGroups(user?.role).map(group => <nav className="footer-column" aria-label={t(group.title)} key={group.title}>
        <h3>{t(group.title)}</h3>
        <ul>{group.links.map(link => <li key={link.label}>{link.href
          ? <a href={link.href} onClick={event => follow(event, link.href)}>{t(link.label)}</a>
          : <button type="button" aria-haspopup="dialog" onClick={() => setTopic(link.topic)}>{t(link.label)}</button>
        }</li>)}</ul>
      </nav>)}
    </div>
    <div className="footer-bottom container">
      <p>{t("© {{year}} STAY. All rights reserved.", { year })}</p>
      <span className="footer-demo"><span aria-hidden="true" />{t("Portfolio demo · Test payments only")}</span>
      <button className="footer-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion() ? "instant" : "smooth" })}>{t("Back to top")}<Icon name="chevron" size={16} /></button>
    </div>
    {topic && <FooterHelp topic={topic} role={user?.role} onClose={() => setTopic(null)} onFollow={(event, href) => { follow(event, href); if (event.defaultPrevented) setTopic(null); }} />}
  </footer>;
}
