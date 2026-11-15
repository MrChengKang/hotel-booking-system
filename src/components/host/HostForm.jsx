import { useRef, useState } from "react";
import Modal from "../common/Modal";

/** Mutations happen only on explicit form submission. Failed responses leave the form open. */
export default function HostForm({ title, children, onClose, onSubmit, onSuccess, submitLabel = "Save changes" }) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    pending.current = true; setBusy(true); setError("");
    try { const result = await onSubmit(data); onSuccess(result); }
    catch (failure) { setError(failure.message || "Unable to save. Please try again."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <Modal title={title} onClose={() => { if (!pending.current) onClose(); }}><form className="host-form" aria-label={title} onSubmit={submit}><fieldset disabled={busy}>{children}</fieldset>{error && <p className="host-error" role="alert">{error}</p>}<div className="host-form-actions"><button className="host-primary" disabled={busy} type="submit">{busy ? "Saving…" : submitLabel}</button><button className="outline-button" disabled={busy} type="button" onClick={onClose}>Cancel</button></div></form></Modal>;
}

export function Field({ label, name, children, ...props }) {
  return <label className="host-field">{label}{children || <input name={name} {...props} />}</label>;
}
export function HostPager({ data, page, onChange }) {
  if (!data || data.totalPages <= 1) return null;
  return <div className="host-pager"><button className="outline-button" disabled={page === 0} onClick={() => onChange(page - 1)}>Previous</button><span>Page {page + 1} / {data.totalPages}</span><button className="outline-button" disabled={page + 1 >= data.totalPages} onClick={() => onChange(page + 1)}>Next</button></div>;
}
