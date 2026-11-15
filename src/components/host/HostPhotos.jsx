import { useEffect, useRef, useState } from "react";
import useResource from "../../hooks/useResource";
import { getHostRooms, getHostImages, uploadHostImage, orderHostImages, captionHostImage, deleteHostImage } from "../../services/hostApi";
import { mediaUrl } from "../../services/apiClient";
import RequestState from "../live/RequestState";
import Modal from "../common/Modal";
import "./HostPhotos.css";

export default function HostPhotos({ hotel, roomId, onRoomChange, onNotify }) {
  const rooms = useResource(`photo-rooms:${hotel.id}`, signal => getHostRooms(hotel.id, signal));
  return <><label className="host-field host-photo-scope">Photo collection<select aria-label="Photo collection" value={roomId || ""} onChange={event => onRoomChange(event.target.value)}><option value="">Hotel photos</option>{rooms.data?.map(room => <option key={room.id} value={room.id}>{room.name}{room.active ? "" : " · Inactive"}</option>)}</select></label><RequestState resource={rooms} loading="Loading room types…" /><PhotoCollection key={`${hotel.id}:${roomId || "hotel"}`} hotel={hotel} roomId={roomId} onNotify={onNotify} /></>;
}

function PhotoCollection({ hotel, roomId, onNotify }) {
  const photos = useResource(`photos:${hotel.id}:${roomId || "hotel"}`, signal => getHostImages(hotel.id, roomId, signal));
  const [file, setFile] = useState(null), [preview, setPreview] = useState(""), [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [deleting, setDeleting] = useState(null), [editing, setEditing] = useState(null);
  const lock = useRef(false), input = useRef(null), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (!file) { setPreview(""); return; } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url); }, [file]);
  async function mutate(action, message) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try { await action(); if (mounted.current) { setDeleting(null); setEditing(null); photos.reload(); onNotify?.(message); } }
    catch (failure) { if (mounted.current) setError(failure.message); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  function choose(event) {
    const chosen = event.target.files?.[0]; setError(""); setFile(null);
    if (!chosen) return;
    if (!/\.(jpe?g|png)$/i.test(chosen.name) || chosen.size > 5 * 1024 * 1024 || chosen.size === 0) { setError("Choose a JPG or PNG photo, up to 5 MB."); event.target.value = ""; return; }
    setFile(chosen);
  }
  function move(photo, offset, cover = false) {
    const ids = photos.data.map(item => item.id), index = ids.indexOf(photo.id);
    ids.splice(index, 1); ids.splice(cover ? 0 : index + offset, 0, photo.id);
    mutate(() => orderHostImages(hotel.id, roomId, ids), "Photo order updated.");
  }
  const archived = hotel.status === "ARCHIVED" || hotel.reviewStatus === "PENDING", items = photos.data || [];
  return <section className="host-panel" aria-busy={busy}><div className="host-section-head"><div><h2>{roomId ? "Room type photos" : "Hotel photos"}</h2><p>The first photo is the cover. Up to 20 photos per collection.</p></div><button className="outline-button" disabled={busy} onClick={photos.reload}>Refresh photos</button></div><p className="host-muted">JPG or PNG · up to 5 MB each · up to 6000 × 6000 pixels and 25 megapixels. Draft photos are visible to you and platform administrators.</p>
    {archived ? <p>This hotel is read-only while archived or awaiting review.</p> : <form className="host-upload" onSubmit={event => { event.preventDefault(); if (file) mutate(async () => { await uploadHostImage(hotel.id, roomId, file, alt); if (mounted.current) { setFile(null); setAlt(""); if (input.current) input.current.value = ""; } }, "Photo uploaded."); }}><fieldset disabled={busy || photos.status !== "ready" || items.length >= 20}><label className="host-field">Choose photo<input ref={input} type="file" accept="image/jpeg,image/png" onChange={choose} /></label><label className="host-field">Photo description<input maxLength={120} value={alt} onChange={event => setAlt(event.target.value)} placeholder="E.g. Deluxe room with a king bed" /></label>{preview && <img className="host-upload-preview" src={preview} alt="Selected upload preview" />}<button className="host-primary" disabled={!file} type="submit">{busy ? "Saving…" : "Upload photo"}</button></fieldset></form>}
    {error && <p className="host-photo-error" role="alert">{error}</p>}<RequestState resource={photos} loading="Loading photos…" />{photos.status === "ready" && !items.length && <p>No photos yet. Add photos to help guests explore your hotel.</p>}
    <div className="host-photo-grid">{items.map((photo, index) => <article key={photo.id}><img src={mediaUrl(photo.url)} alt={photo.altText || (roomId ? "Room photo" : hotel.name)} loading="lazy" /><div className="host-photo-info"><strong>{index === 0 ? "Cover photo" : `Photo ${index + 1}`}</strong><p>{photo.altText || "No description"}</p><small>{photo.width} × {photo.height}</small>{!archived && <div className="host-photo-actions"><button className="outline-button" disabled={busy || index === 0} onClick={() => move(photo, 0, true)}>Set cover</button><button className="outline-button" aria-label={`Move photo ${index + 1} earlier`} disabled={busy || index === 0} onClick={() => move(photo, -1)}>←</button><button className="outline-button" aria-label={`Move photo ${index + 1} later`} disabled={busy || index === items.length - 1} onClick={() => move(photo, 1)}>→</button><button className="host-text" disabled={busy} onClick={() => { setError(""); setEditing({ ...photo }); }}>Edit description</button><button className="host-text" disabled={busy} onClick={() => { setError(""); setDeleting(photo); }}>Delete</button></div>}</div></article>)}</div>
    {!archived && deleting && <Modal title="Delete photo?" onClose={() => { if (!busy) setDeleting(null); }}><p>This permanently removes the photo from this collection.</p>{error && <p role="alert">{error}</p>}<button className="outline-button" disabled={busy} onClick={() => setDeleting(null)}>Keep photo</button> <button className="host-primary" disabled={busy} onClick={() => mutate(() => deleteHostImage(hotel.id, deleting.id), "Photo deleted.")}>{busy ? "Deleting…" : "Delete photo"}</button></Modal>}
    {!archived && editing && <Modal title="Edit photo description" onClose={() => { if (!busy) setEditing(null); }}><form onSubmit={event => { event.preventDefault(); mutate(() => captionHostImage(hotel.id, editing.id, editing.altText), "Description saved."); }}><label className="host-field">Photo description<input maxLength={120} disabled={busy} value={editing.altText} onChange={event => setEditing({ ...editing, altText: event.target.value })} /></label>{error && <p role="alert">{error}</p>}<button className="host-primary" disabled={busy}>{busy ? "Saving…" : "Save description"}</button></form></Modal>}
  </section>;
}
