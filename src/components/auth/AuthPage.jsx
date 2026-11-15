import { useTranslation, localizeError } from "../../i18n";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { photo } from "../../utils/images";
import "./AuthPage.css";

export default function AuthPage({ mode, onNavigate, onSuccess }) {
  const { t } = useTranslation();
  const registering = mode === "register";
  const auth = useAuth();
  const heading = useRef(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { heading.current?.focus(); }, []);
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (registering && data.password !== data.confirmPassword) { setError("Passwords do not match."); return; }
    setError(""); setBusy(true);
    try {
      const user = registering ? await auth.register(data) : await auth.login(data.email, data.password, data.rememberMe === "true");
      onSuccess(user);
    } catch (failure) {
      setError(failure.message || "Unable to continue. Please try again.");
      setBusy(false);
    }
  }
  return <section className="auth-page container">
    <aside className="auth-story" style={{ backgroundImage: `linear-gradient(0deg, #111827ba, #11182700), url(${photo("photo-1566073771259-6a8506099945", 1000)})` }}>
      <span>{t("MAKE ROOM FOR YOUR NEXT CHAPTER")}</span><h2>{t("A great stay starts here.")}</h2><p>{t("Discover beautiful hotels. Find your kind of comfort.")}</p>
    </aside>
    <div className="auth-content">
      <a href="/" className="auth-back" onClick={event => { event.preventDefault(); onNavigate("/"); }}>{t("← Back to hotels")}</a>
      <h1 ref={heading} tabIndex={-1}>{registering ? t("Create your account") : t("Welcome back")}</h1>
      <p>{registering ? t("Your next great hotel stay is one step closer.") : t("Sign in to your STAY account.")}</p>
      <form onSubmit={submit} aria-label={registering ? t("Register") : t("Login")}>
        {registering && <label>{t("Full name")}<input name="name" autoComplete="name" required maxLength={80} /></label>}
        <label>{t("Email address")}<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label htmlFor="auth-password">{t("Password")}</label>
        <div className="auth-password"><input id="auth-password" name="password" type={visible ? "text" : "password"} autoComplete={registering ? "new-password" : "current-password"} minLength={registering ? 8 : undefined} required maxLength={72} aria-describedby={registering ? "password-hint" : undefined} /><button type="button" aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? t("Hide password") : t("Show password")}</button></div>
        {registering && <><small id="password-hint">{t("Use at least 8 characters, up to 72 UTF-8 bytes.")}</small><label>{t("Confirm password")}<input name="confirmPassword" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={72} /></label>
          <fieldset><legend>{t("I’m joining as")}</legend><label><input type="radio" name="role" value="user" defaultChecked />{t("User")}{" "}<small>{t("Find and book hotels")}</small></label><label><input type="radio" name="role" value="host" />{t("Hotel Host")}{" "}<small>{t("Manage your hotel")}</small></label></fieldset></>}
        {error && <p className="auth-error" role="alert">{localizeError(error, t)}</p>}
        {!registering && <><div className="auth-login-options"><label className="auth-remember"><input name="rememberMe" type="checkbox" value="true" aria-describedby="auth-remember-hint" disabled={busy} />{t("Remember me")}</label><a className="auth-forgot-link" href="/forgot-password" onClick={event => { event.preventDefault(); onNavigate("/forgot-password"); }}>{t("Forgot password?")}</a></div><small id="auth-remember-hint">{t("Keep me signed in for 30 days.")}</small></>}
        <button className="auth-submit" disabled={busy || auth.loading} type="submit">{busy ? t("Please wait…") : registering ? t("Create account") : t("Sign in")}</button>
      </form>
      <p className="auth-switch">{registering ? t("Already have an account?") : t("New to STAY?")} <a href={registering ? "/login" : "/register"} onClick={event => { event.preventDefault(); onNavigate(registering ? "/login" : "/register"); }}>{registering ? t("Sign in") : t("Create an account")}</a></p>
      <div className="auth-demo"><strong>{t("Your STAY account")}</strong><p>{t("Sign in with your registered email. Admin accounts are created by the platform. User accounts can reserve published hotels and manage their bookings.")}</p></div>
    </div>
  </section>;
}
