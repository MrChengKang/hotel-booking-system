import { useTranslation } from "../../i18n";
import { useEffect, useRef } from "react";

export default function Modal({ title, children, onClose, onKeyDown, className = "" }) {
  const { t } = useTranslation();
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} className={`hotel-modal ${className}`.trim()} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={onKeyDown} onClick={(event) => { if (event.target === dialog.current) onClose(); }}><div className="hotel-modal-heading"><h2>{title}</h2><button onClick={onClose} aria-label={t("Close dialog")}>×</button></div>{children}</dialog>;
}
