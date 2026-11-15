import { useTranslation } from "../../i18n";
import { footerHelp } from "../../data/navigation";
import Modal from "../common/Modal";

export default function FooterHelp({ topic, role, onClose, onFollow }) {
  const { t } = useTranslation();
  const content = footerHelp[topic];
  const action = role === "host" ? ["Host Dashboard", "/host"]
    : role === "admin" ? ["Admin Dashboard", "/admin"]
      : topic === "hosting" ? role ? null : ["Create an account", "/register"]
        : ["Your bookings", "/bookings"];
  return <Modal title={t(content.title)} className="footer-help-dialog" onClose={onClose}>
    <div className="footer-help-content">{content.sections.map(([heading, body]) => <section key={heading}><h3>{t(heading)}</h3><p>{t(body)}</p></section>)}</div>
    {action && <a className="dark-button footer-help-action" href={action[1]} onClick={event => onFollow(event, action[1])}>{t(action[0])}<span aria-hidden="true">↗</span></a>}
  </Modal>;
}
