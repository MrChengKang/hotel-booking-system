import "./Toast.css";
import { useTranslation } from "../../i18n";

export default function Toast({ message, onClose }) {
  const { t } = useTranslation();
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button aria-label={t("Close message")} onClick={onClose}>×</button>
    </div>
  );
}
