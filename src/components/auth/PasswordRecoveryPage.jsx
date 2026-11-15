import { useTranslation, localizeError } from "../../i18n";
import { useEffect, useRef, useState } from "react";
import { forgotPassword } from "../../services/authApi";
import { useAuth } from "../../context/AuthContext";
import "./AuthPage.css";

export default function PasswordRecoveryPage({ mode, onNavigate }) {
  const { t } = useTranslation();
  const resetting = mode === "reset-password";
  const auth = useAuth();
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
  const validLink = /^[A-Za-z0-9_-]{43}$/.test(token);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(false);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [done]);

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    if (resetting && form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (resetting && new TextEncoder().encode(form.password).length > 72) { setError("Password must be at most 72 UTF-8 bytes."); return; }
    pending.current = true; setBusy(true); setError("");
    try {
      if (resetting) {
        await auth.resetPassword(token, form.password);
        window.history.replaceState({}, "", "/reset-password");
      } else await forgotPassword(form.email.trim());
      setDone(true);
    } catch (failure) { setError(failure.message || "Unable to continue. Please try again."); }
    finally { pending.current = false; setBusy(false); }
  }
  function link(event, path) { event.preventDefault(); onNavigate(path); }

  return <section className="auth-page auth-recovery container">
    <div className="auth-content">
      <a className="auth-back" href="/login" onClick={event => link(event, "/login")}>{t("← Back to sign in")}</a>
      <h1 ref={heading} tabIndex={-1}>{done ? resetting ? t("Password reset") : t("Check your email") : resetting ? t("Set a new password") : t("Forgot your password?")}</h1>
      {done ? <>
        <p role="status">{resetting ? t("Your password has been reset. Sign in with your new password. Previous sessions are no longer valid.") : t("If an account exists for this email, a reset link will be sent. Check your inbox and spam folder. The link expires in 15 minutes.")}</p>
        <a className="auth-submit auth-primary-link" href="/login" onClick={event => link(event, "/login")}>{t("Back to sign in")}</a>
        {!resetting && <p className="auth-switch">{t("No email yet? Wait a minute, then")}{" "}<button onClick={() => setDone(false)}>{t("try again")}</button>.</p>}
      </> : resetting && !validLink ? <>
        <p role="alert">{t("This reset link is missing or invalid. Request a new link to continue.")}</p>
        <a className="auth-submit auth-primary-link" href="/forgot-password" onClick={event => link(event, "/forgot-password")}>{t("Request a new link")}</a>
      </> : <>
        <p>{resetting ? t("Choose a new password for your STAY account.") : t("Enter your account email and we’ll send you a password reset link.")}</p>
        <form aria-label={resetting ? t("Reset password") : t("Forgot password")} onSubmit={submit}>
          {resetting ? <>
            <label htmlFor="reset-password">{t("New password")}</label>
            <div className="auth-password"><input id="reset-password" name="password" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={72} aria-describedby="reset-password-hint" /><button type="button" aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? t("Hide password") : t("Show password")}</button></div>
            <small id="reset-password-hint">{t("Use at least 8 characters, up to 72 UTF-8 bytes.")}</small>
            <label>{t("Confirm new password")}<input name="confirmPassword" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={72} /></label>
          </> : <label>{t("Email address")}<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>}
          {error && <p role="alert" className="auth-error">{localizeError(error, t)}</p>}
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? t("Please wait…") : resetting ? t("Reset password") : t("Send reset link")}</button>
        </form>
        {resetting && <p className="auth-switch"><a href="/forgot-password" onClick={event => link(event, "/forgot-password")}>{t("Request a new reset link")}</a></p>}
      </>}
    </div>
  </section>;
}
