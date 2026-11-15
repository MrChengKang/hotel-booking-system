import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProfile } from "../../services/accountApi";
import useResource from "../../hooks/useResource";
import AvatarEditor from "./AvatarEditor";
import UserAvatar from "../common/UserAvatar";
import RequestState from "../live/RequestState";
import "./AccountPage.css";

export function AccountAccess({ destination, onLogin, children }) {
  const { user, loading } = useAuth();
  useEffect(() => { if (!loading && !user) onLogin(destination); }, [user, loading, destination, onLogin]);
  if (loading) return <p className="container account-page" role="status">Checking your account…</p>;
  if (!user) return <section className="container account-page"><h1>Sign in to your account</h1><button className="dark-button" onClick={() => onLogin(destination)}>Sign in</button></section>;
  return children;
}
export default function AccountPage({ onLogin, onNotify, onWishlist }) {
  const { user } = useAuth();
  return <AccountAccess destination="/account" onLogin={onLogin}>{user && <Profile key={user.id} user={user} onNotify={onNotify} onWishlist={onWishlist} />}</AccountAccess>;
}
function Profile({ user, onNotify, onWishlist }) {
  const resource = useResource(`profile:${user.id}`, getProfile);
  return <section className="container account-page"><div className="account-heading"><div><span className="account-eyebrow">YOUR STAY ACCOUNT</span><h1>Personal information</h1><p>Keep your details up to date for your next stay.</p></div><button className="outline-button" onClick={onWishlist}>View saved hotels ♡</button></div><RequestState resource={resource} loading="Loading your profile…" />{resource.status === "ready" && <ProfileForm profile={resource.data} onNotify={onNotify} />}</section>;
}
function ProfileForm({ profile, onNotify }) {
  const auth = useAuth(), [values, setValues] = useState({ name: profile.name, phone: profile.phone || "", city: profile.city || "", bio: profile.bio || "" });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [saved, setSaved] = useState(false);
  const lock = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  function field(event) { setValues(current => ({ ...current, [event.target.name]: event.target.value })); setSaved(false); }
  async function submit(event) {
    event.preventDefault(); if (lock.current) return; lock.current = true; setBusy(true); setError(""); setSaved(false);
    try { const result = await auth.updateProfile(values); if (mounted.current) { setValues({ name: result.name, phone: result.phone, city: result.city, bio: result.bio }); setSaved(true); onNotify?.("Profile updated."); } }
    catch (failure) { if (mounted.current) setError(failure.message); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return <div className="account-layout"><aside className="account-summary"><UserAvatar user={auth.user} className="account-avatar" label="Your profile photo" /><h2>{auth.user.name}</h2><p>{profile.role === "host" ? "Hotel Host" : profile.role === "admin" ? "Admin" : "Guest"}</p>{profile.createdAt && <p>Member since {new Date(profile.createdAt).toLocaleDateString("en", { month: "long", year: "numeric" })}</p>}<AvatarEditor onNotify={onNotify} /></aside><form className="account-form" aria-label="Personal information" onSubmit={submit}><fieldset disabled={busy}><div className="account-fields"><label>Full name<input name="name" autoComplete="name" required maxLength={80} value={values.name} onChange={field} /></label><label>Email address<input type="email" value={profile.email} readOnly aria-describedby="account-email-note" /></label><label>Phone number<input name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="+60 12 345 6789" value={values.phone} onChange={field} /></label><label>City<input name="city" autoComplete="address-level2" maxLength={100} placeholder="Kuala Lumpur" value={values.city} onChange={field} /></label><label className="account-bio">About you<textarea name="bio" rows={4} maxLength={500} value={values.bio} onChange={field} /><small>{values.bio.length} / 500</small></label></div><p id="account-email-note" className="account-muted">Your sign-in email and account role cannot be changed here. Your phone number and introduction are private account details.</p>{error && <p role="alert" className="account-error">{error}</p>}{saved && <p role="status">Your profile has been saved.</p>}<button className="dark-button" type="submit">{busy ? "Saving…" : "Save changes"}</button></fieldset></form></div>;
}
