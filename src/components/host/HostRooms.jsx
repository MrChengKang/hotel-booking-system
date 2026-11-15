import { useState } from "react";
import { createHostRoom, editHostRoom, getHostRooms } from "../../services/hostApi";
import { usePreferences } from "../../context/PreferencesContext";
import useResource from "../../hooks/useResource";
import { money } from "../../utils/liveBooking";
import RequestState from "../live/RequestState";
import HostForm, { Field } from "./HostForm";

export default function HostRooms({ hotel, onInventory, onPhotos, onNotify }) {
  const resource = useResource(`rooms:${hotel.id}`, signal => getHostRooms(hotel.id, signal));
  const [editing, setEditing] = useState(null);
  const { language } = usePreferences();
  const archived = hotel.status === "ARCHIVED" || hotel.reviewStatus === "PENDING";
  return <section className="host-panel"><div className="host-section-head"><div><h2>Room types</h2><p>{hotel.name} · {hotel.currencyCode}</p></div><button className="host-primary" disabled={archived} onClick={() => setEditing("new")}>Add room type</button></div>{archived && <p className="host-notice">This hotel is read-only while archived or awaiting review.</p>}<RequestState resource={resource} loading="Loading room types…" />
    {resource.status === "ready" && resource.data.length === 0 && <div className="host-empty"><h3>Add your first room type</h3><p>Set the guest capacity, actual room count and base nightly rate. Daily rates can be changed later.</p></div>}
    <div className="host-room-grid">{resource.status === "ready" && resource.data.map(room => <article className="host-hotel-card" key={room.id}><span className={`host-badge ${room.active ? "status-published" : "status-draft"}`}>{room.active ? "Active" : "Inactive"}</span><h3>{room.name}</h3><p className="host-muted">{room.code} · up to {room.maxGuests} guests · {room.beds} bed(s)</p><p>{room.totalRooms} rooms · <strong>{money(room.basePrice, hotel.currencyCode, language)}</strong> / night base rate</p><p className="host-description">{room.description}</p><div className="host-card-actions"><button className="outline-button" disabled={archived} onClick={() => setEditing(room)}>Edit room type</button><button className="host-text" onClick={() => onInventory(room.id)}>Manage inventory</button>{onPhotos && <button className="host-text" onClick={() => onPhotos(room.id)}>Manage photos</button>}</div></article>)}</div>
    {!archived && editing && <HostForm submitLabel={editing === "new" ? "Create room type" : "Save room type"} title={editing === "new" ? "Add room type" : "Edit room type"} onClose={() => setEditing(null)} onSubmit={data => {
      const common = { name: data.name.trim(), description: data.description, basePrice: data.basePrice };
      return editing === "new" ? createHostRoom(hotel.id, { ...common, code: data.code.toUpperCase(), maxGuests: Number(data.maxGuests), beds: Number(data.beds), totalRooms: Number(data.totalRooms) }) : editHostRoom(editing.id, { ...common, active: data.active === "on" });
    }} onSuccess={() => { setEditing(null); resource.reload(); onNotify("Room type saved. Initialize its inventory to make nights bookable."); }}><div className="host-form-grid"><Field label="Room type name" name="name" defaultValue={editing.name || ""} required maxLength={120} /><Field label="Description"><textarea name="description" defaultValue={editing.description || ""} rows={3} maxLength={10000} /></Field><Field label={`Base nightly rate (${hotel.currencyCode})`} name="basePrice" type="number" min="0" max="9999999999.99" step="0.01" required defaultValue={editing.basePrice ?? ""} />{editing === "new" ? <><Field label="Room code" name="code" pattern="[A-Za-z0-9_-]+" required maxLength={40} /><Field label="Guests per room" name="maxGuests" type="number" min="1" max="1000" required defaultValue={2} /><Field label="Beds per room" name="beds" type="number" min="1" required defaultValue={1} /><Field label="Actual total rooms" name="totalRooms" type="number" min="1" required defaultValue={1} /></> : <><label className="host-check"><input type="checkbox" name="active" defaultChecked={editing.active} />Active and available for booking</label><p className="host-muted">Code, guest capacity, beds and actual room count are fixed after creation. Changing the base rate does not overwrite existing daily prices.</p></>}</div></HostForm>}
  </section>;
}
