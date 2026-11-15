import { useState } from "react";
import { hotelAmenities } from "../../data/hotelAmenities";
import { changeHotelStatus, createHostHotel, editHostHotel, submitHostHotel } from "../../services/hostApi";
import RequestState from "../live/RequestState";
import HostForm, { Field, HostPager } from "./HostForm";

export default function HostHotels({ resource, page, onPage, onChoose, onNotify, onRefresh }) {
  const [form, setForm] = useState(null);
  const saved = result => { setForm(null); onRefresh(); onNotify("Hotel saved. Submit it for review when its setup is ready."); if (form === "new") onChoose(result.id, "rooms"); };
  function closeStatus(result) {
    setForm(null); onRefresh();
    onNotify(result.reviewStatus === "PENDING" ? "Hotel submitted for administrator review." : `Hotel status updated to ${result.status.toLowerCase()}.`);
  }
  return <section className="host-panel">
    <div className="host-section-head"><div><h2>Your hotels</h2><p>Create a draft, add rooms, photos and inventory, then submit it for review.</p></div><button className="host-primary" onClick={() => setForm("new")}>Add hotel</button></div>
    <RequestState resource={resource} loading="Loading your hotels…" />
    {resource.status === "ready" && resource.data.items.length === 0 && <div className="host-empty"><h3>Your first hotel starts here</h3><p>Add its details, create a room type and set the nights you want to sell.</p><button className="outline-button" onClick={() => setForm("new")}>Create your first hotel</button></div>}
    <div className="host-hotel-grid">{resource.status === "ready" && resource.data.items.map(hotel => {
      const pending = hotel.reviewStatus === "PENDING";
      return <article className="host-hotel-card" key={hotel.id}>
        <div className="host-section-head"><span className={`host-badge status-${hotel.status.toLowerCase()}`}>{hotel.status}</span><span className="host-muted">#{hotel.id}</span></div>
        <h3>{hotel.name}</h3><p>{hotel.city}, {hotel.countryCode} · {hotel.currencyCode}</p><p className="host-muted">{hotel.address}</p>
        {pending && <p className="host-notice">Awaiting administrator review. Withdraw the submission before editing hotel details, rooms, photos or inventory.</p>}
        {hotel.reviewStatus === "REJECTED" && <div className="host-review-note"><strong>Changes requested</strong><p>{hotel.reviewNote || "Review the hotel setup and submit it again."}</p></div>}
        <div className="host-card-actions"><button className="outline-button" onClick={() => onChoose(hotel.id, "rooms")}>Manage rooms</button><button className="host-text" disabled={hotel.status === "ARCHIVED" || pending} onClick={() => setForm({ hotel })}>Edit hotel</button><button className="host-text" onClick={() => onChoose(hotel.id, "bookings")}>View orders</button></div>
        {hotel.status !== "ARCHIVED" && <div className="host-card-actions">
          {hotel.status === "PUBLISHED" ? <button className="host-text" onClick={() => setForm({ hotel, status: "DRAFT" })}>Unpublish</button> : pending ? <button className="host-text" onClick={() => setForm({ hotel, status: "DRAFT", withdraw: true })}>Withdraw submission</button> : <button className="host-text" onClick={() => setForm({ hotel, submit: true })}>Submit for review</button>}
          <button className="host-text host-danger" onClick={() => setForm({ hotel, status: "ARCHIVED" })}>Archive</button>
        </div>}
      </article>;
    })}</div>
    <HostPager data={resource.data} page={page} onChange={onPage} />
    {form && (form.submit ? <HostForm title="Submit hotel for review?" onClose={() => setForm(null)} onSubmit={() => submitHostHotel(form.hotel.id)} onSuccess={closeStatus} submitLabel="Submit for review"><h3>{form.hotel.name}</h3><p>Your hotel stays hidden until an administrator approves it. Add a description, at least one active room type, a hotel photo and upcoming sellable inventory before submitting.</p><p>While review is pending, hotel details, room types, photos and inventory are read-only. You can withdraw the submission to make changes.</p></HostForm> : form.status ? <HostForm title={form.status === "ARCHIVED" ? "Archive hotel?" : form.withdraw ? "Withdraw submission?" : "Unpublish hotel?"} onClose={() => setForm(null)} onSubmit={() => changeHotelStatus(form.hotel.id, form.status)} onSuccess={closeStatus} submitLabel="Confirm status change"><h3>{form.hotel.name}</h3><p>{form.status === "ARCHIVED" ? "Archiving is permanent: this hotel cannot be reopened or edited. Existing orders stay available." : form.withdraw ? "The hotel returns to an editable draft. Submit it again when your changes are ready." : "This hotel will be hidden from guests. Existing bookings remain unchanged. Publishing it again requires administrator review."}</p></HostForm> : <HotelEditor hotel={form.hotel} onClose={() => setForm(null)} onSuccess={saved} />)}
  </section>;
}

function HotelEditor({ hotel, onClose, onSuccess }) {
  const [name, setName] = useState(hotel?.name || "");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [amenities, setAmenities] = useState(hotel?.amenities || []);
  function changeName(value) { setName(value); if (!slugEdited) setSlug(value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180)); }
  return <HostForm title={hotel ? "Edit hotel" : "Add hotel"} onClose={onClose} onSuccess={onSuccess} submitLabel={hotel ? "Save hotel" : "Create draft hotel"} onSubmit={data => {
    const common = { name: data.name.trim(), description: data.description, address: data.address.trim(), city: data.city.trim(), amenities };
    return hotel ? editHostHotel(hotel.id, common) : createHostHotel({ ...common, slug: data.slug, countryCode: data.countryCode.toUpperCase(), currencyCode: data.currencyCode.toUpperCase(), timeZone: data.timeZone.trim() });
  }}>{hotel?.status === "PUBLISHED" && <p className="host-notice">Saving hotel details takes this listing offline for a new review. Existing reservations remain unchanged.</p>}<div className="host-form-grid"><Field label="Hotel name" name="name" value={name} onChange={event => changeName(event.target.value)} required maxLength={160} /><Field label="City" name="city" defaultValue={hotel?.city} required maxLength={100} /><Field label="Address" name="address" defaultValue={hotel?.address} required maxLength={500} /><Field label="Description"><textarea name="description" defaultValue={hotel?.description} maxLength={10000} rows={4} /></Field>
    {!hotel ? <><Field label="Hotel URL slug" name="slug" value={slug} onChange={event => { setSlugEdited(true); setSlug(event.target.value); }} pattern="[a-z0-9]+(-[a-z0-9]+)*" required maxLength={180} /><Field label="Country code" name="countryCode" defaultValue="MY" required minLength={2} maxLength={2} pattern="[A-Za-z]{2}" /><Field label="Currency code" name="currencyCode" defaultValue="MYR" required minLength={3} maxLength={3} pattern="[A-Za-z]{3}" /><Field label="Hotel time zone" name="timeZone" defaultValue="Asia/Kuala_Lumpur" required maxLength={64} /></> : <p className="host-muted">Slug, country, currency and time zone are fixed after creation to protect existing bookings.</p>}
  </div><fieldset className="host-amenities"><legend>Hotel facilities</legend><p className="host-muted">Select only facilities your hotel actually offers. Guests can filter by these.</p>{hotelAmenities.map(([code, label]) => <label key={code}><input type="checkbox" checked={amenities.includes(code)} onChange={event => setAmenities(current => event.target.checked ? [...current, code] : current.filter(value => value !== code))} />{label}</label>)}</fieldset></HostForm>;
}
