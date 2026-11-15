import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Modal from "../common/Modal";

export default function AvatarEditor({ onNotify }) {
  const auth = useAuth(), [file, setFile] = useState(null), [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [status, setStatus] = useState(""), [removing, setRemoving] = useState(false);
  const input = useRef(null), lock = useRef(false), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (!file) { setPreview(""); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  function choose(event) {
    const chosen = event.target.files?.[0]; setError(""); setStatus(""); setFile(null);
    if (!chosen) return;
    if (!/\.(jpe?g|png)$/i.test(chosen.name) || !chosen.size || chosen.size > 5 * 1024 * 1024) { setError("Choose a JPG or PNG image, up to 5 MB."); event.target.value = ""; return; }
    setFile(chosen);
  }
  async function save(remove = false) {
    if (lock.current || (!remove && !file)) return;
    lock.current = true; setBusy(true); setError(""); setStatus("");
    try {
      if (remove) await auth.removeAvatar(); else await auth.uploadAvatar(file);
      if (mounted.current) { setFile(null); if (input.current) input.current.value = ""; setRemoving(false); const message = remove ? "Profile photo removed." : "Profile photo updated."; setStatus(message); onNotify?.(message); }
    } catch (failure) { if (mounted.current) setError(failure.message); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  return <div className="avatar-editor"><label>Profile photo<input ref={input} type="file" accept="image/jpeg,image/png" disabled={busy} onChange={choose} aria-describedby="avatar-upload-note" /></label><p id="avatar-upload-note">JPG or PNG · up to 5 MB. Your photo is displayed in a circle.</p>{preview && <img className="avatar-upload-preview" src={preview} alt="New avatar preview" />}<div className="avatar-editor-actions"><button type="button" className="dark-button" disabled={busy || !file} onClick={() => save()}>{busy ? "Saving…" : "Upload photo"}</button>{auth.user.avatarUrl && <button type="button" className="outline-button" disabled={busy} onClick={() => { setError(""); setRemoving(true); }}>Remove photo</button>}</div>{error && !removing && <p role="alert" className="account-error">{error}</p>}{status && <p role="status" className="avatar-status">{status}</p>}{removing && <Modal title="Remove profile photo?" onClose={() => { if (!busy) setRemoving(false); }}><p>Your account will display your initial until you upload another photo.</p>{error && <p role="alert" className="account-error">{error}</p>}<div className="avatar-editor-actions"><button className="outline-button" disabled={busy} onClick={() => setRemoving(false)}>Keep photo</button><button className="dark-button" disabled={busy} onClick={() => save(true)}>{busy ? "Removing…" : "Confirm removal"}</button></div></Modal>}</div>;
}
