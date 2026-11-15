import { useState } from "react";
import { getHostInventory, getHostRooms, initializeHostInventory, editHostInventory } from "../../services/hostApi";
import useResource from "../../hooks/useResource";
import { hotelToday, money } from "../../utils/liveBooking";
import { addDays, nightsBetween } from "../../utils/dates";
import { usePreferences } from "../../context/PreferencesContext";
import RequestState from "../live/RequestState";
import HostForm, { Field } from "./HostForm";

export default function HostInventory({ hotel, roomId, onRoomChange, onNotify }) {
  const rooms = useResource(`stock-rooms:${hotel.id}`, signal => getHostRooms(hotel.id, signal));
  const selected = rooms.data?.find(item => String(item.id) === String(roomId)) || (!roomId ? rooms.data?.[0] : null);
  return <><RequestState resource={rooms} loading="Loading room types…" />{rooms.status === "ready" && <>{rooms.data.length === 0 ? <div className="host-panel host-empty"><h2>No room types yet</h2><p>Create a room type first, then initialize its nightly inventory.</p></div> : <><label className="host-field host-room-picker">Room type<select aria-label="Room type" value={selected?.id || ""} onChange={event => onRoomChange(event.target.value)}><option value="" disabled>Select room type</option>{rooms.data.map(room => <option value={room.id} key={room.id}>{room.name}{room.active ? "" : " (inactive)"}</option>)}</select></label>{selected ? <InventoryDates key={selected.id} hotel={hotel} room={selected} onNotify={onNotify} /> : <p role="alert" className="host-error">This room type is not part of the selected hotel.</p>}</>}</>}</>;
}

function InventoryDates({ hotel, room, onNotify }) {
  const today = hotelToday(hotel.timeZone);
  const [range, setRange] = useState({ from: today, to: addDays(today, 14) });
  const [form, setForm] = useState(null);
  const [rangeError, setRangeError] = useState("");
  const { language } = usePreferences();
  const inventory = useResource(JSON.stringify([room.id, range]), signal => getHostInventory(room.id, range.from, range.to, signal));
  const archived = hotel.status === "ARCHIVED" || hotel.reviewStatus === "PENDING";
  const days = nightsBetween(range.from, range.to);
  function validRange(data) {
    const count = nightsBetween(data.from, data.to);
    if (!data.from || !data.to || !Number.isInteger(count) || count < 1 || count > 366) throw new Error("Choose a range of 1–366 nights; the end date is excluded.");
    return { from: data.from, to: data.to };
  }
  function load(event) {
    event.preventDefault();
    try { setRange(validRange(Object.fromEntries(new FormData(event.currentTarget)))); setRangeError(""); }
    catch (error) { setRangeError(error.message); }
  }
  return <section className="host-panel"><div className="host-section-head"><div><h2>Daily inventory</h2><p>{room.name} · {room.totalRooms} actual rooms · {hotel.timeZone}</p></div><button className="host-primary" disabled={archived} onClick={() => setForm("initialize")}>Initialize dates</button></div><p className="host-muted">Start date included; end date excluded. Missing dates cannot be booked. Editing stock never changes booked room counts.</p>
    <form key={`${range.from}:${range.to}`} className="host-range" aria-label="Load inventory dates" onSubmit={load}><Field label="Start date" name="from" type="date" required defaultValue={range.from} /><Field label="End date (excluded)" name="to" type="date" required defaultValue={range.to} /><button className="outline-button" type="submit">Load dates</button></form>{rangeError && <p className="host-error" role="alert">{rangeError}</p>}
    {archived && <p className="host-notice">This hotel is read-only while archived or awaiting review.</p>}<RequestState resource={inventory} loading="Loading daily inventory…" />
    {inventory.status === "ready" && <><p className="host-notice">{inventory.data.length} of {days} nights have inventory.{inventory.data.length < days ? " Initialize missing dates before guests can book this range." : " All dates in this range are configured."}</p><div className="host-table-scroll"><table className="host-table"><caption className="host-sr-only">Daily stock for {room.name}</caption><thead><tr><th>Date</th><th>Nightly rate</th><th>Total</th><th>Booked</th><th>Blocked</th><th>Sellable</th><th>Status</th><th>Actions</th></tr></thead><tbody>{inventory.data.map(day => <tr key={day.date}><th scope="row">{day.date}</th><td>{money(day.nightlyPrice, hotel.currencyCode, language)}</td><td>{day.totalRooms}</td><td>{day.bookedRooms}</td><td>{day.blockedRooms}</td><td>{day.stopSell ? 0 : day.availableRooms}</td><td><span className={`host-badge ${day.stopSell ? "status-draft" : "status-published"}`}>{day.stopSell ? "Stopped" : "Open"}</span></td><td><button className="host-text" disabled={archived} aria-label={`Edit inventory ${day.date}`} onClick={() => setForm(day)}>Edit</button></td></tr>)}</tbody></table></div>{inventory.data.length === 0 && <div className="host-empty"><h3>No nightly inventory in this range</h3><p>Initialize dates to copy the room type’s base price and actual room count into new nights.</p></div>}</>}
    {!archived && form === "initialize" && <HostForm title="Initialize inventory dates" submitLabel="Create missing nights" onClose={() => setForm(null)} onSubmit={async data => { const dates = validRange(data); return { ...await initializeHostInventory(room.id, dates), range: dates }; }} onSuccess={result => { setForm(null); setRange(result.range); inventory.reload(); onNotify(`${result.createdNights} nights added. Existing inventory and bookings were preserved.`); }}><p>New nights start with {room.totalRooms} rooms and {money(room.basePrice, hotel.currencyCode, language)} per night. Existing dates, rates, closures and booked counts are preserved.</p><div className="host-form-grid"><Field label="Start date" name="from" type="date" defaultValue={range.from} required /><Field label="End date (excluded)" name="to" type="date" defaultValue={range.to} required /></div></HostForm>}
    {!archived && form && form !== "initialize" && <DayEditor day={form} room={room} currency={hotel.currencyCode} onClose={() => setForm(null)} onSuccess={() => { setForm(null); inventory.reload(); onNotify("Daily inventory updated."); }} />}
  </section>;
}

function DayEditor({ day, room, currency, onClose, onSuccess }) {
  const [total, setTotal] = useState(day.totalRooms);
  return <HostForm title={`Edit inventory · ${day.date}`} onClose={onClose} onSuccess={onSuccess} onSubmit={data => editHostInventory(room.id, day.date, { totalRooms: Number(data.totalRooms), blockedRooms: Number(data.blockedRooms), nightlyPrice: data.nightlyPrice, stopSell: data.stopSell === "on" })}><p>{day.bookedRooms} room(s) already booked. You cannot reduce stock below existing bookings or exceed the room type’s {room.totalRooms} actual rooms.</p><div className="host-form-grid"><Field label="Total rooms for this date" name="totalRooms" type="number" min={day.bookedRooms} max={room.totalRooms} required value={total} onChange={event => setTotal(event.target.value)} /><Field label="Blocked rooms" name="blockedRooms" type="number" min="0" max={Math.max(0, Number(total) - day.bookedRooms)} required defaultValue={day.blockedRooms} /><Field label={`Nightly rate (${currency})`} name="nightlyPrice" type="number" min="0" max="9999999999.99" step="0.01" required defaultValue={day.nightlyPrice} /><label className="host-check"><input type="checkbox" name="stopSell" defaultChecked={day.stopSell} />Stop selling this date</label></div></HostForm>;
}
