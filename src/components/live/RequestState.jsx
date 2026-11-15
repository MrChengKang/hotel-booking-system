import { useTranslation, localizeError } from "../../i18n";
export default function RequestState({ resource, loading, onLogin }) {
  const { t } = useTranslation();
  if (resource.status === "loading") return <p role="status" className="live-state">{loading || t("Loading…")}</p>;
  if (resource.status !== "error") return null;
  return <div className="live-state" role="alert"><p>{localizeError(resource.error.message, t)}</p>{resource.error.status === 401 && onLogin ? <button className="outline-button" onClick={onLogin}>{t("Sign in")}</button> : <button className="outline-button" onClick={resource.reload}>{t("Try again")}</button>}</div>;
}
