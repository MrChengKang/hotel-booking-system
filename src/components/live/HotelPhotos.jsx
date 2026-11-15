import { useTranslation } from "../../i18n";
import { useState } from "react";
import useResource from "../../hooks/useResource";
import { mediaUrl } from "../../services/apiClient";
import { getHotelImages } from "../../services/hotelApi";
import Modal from "../common/Modal";
import RequestState from "./RequestState";
import "./HotelPhotos.css";

export function HotelCover({ url, name, ...props }) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const src = mediaUrl(url);
  return src && !failed ? <img {...props} src={src} alt={name} onError={() => setFailed(true)} /> : <div className="hotel-photo-placeholder" role="img" aria-label={t("No photos for {{name}}", { name })}><span aria-hidden="true">▧</span><small>{t("Photos coming soon")}</small></div>;
}

export default function HotelPhotos({ hotelId, roomId, name, cover }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false), [index, setIndex] = useState(0);
  const resource = useResource(`public-photos:${hotelId}:${roomId || "hotel"}`, signal => getHotelImages(hotelId, roomId, signal));
  const photos = resource.data || [], selected = photos[index] || photos[0];
  return <div className={roomId ? "hotel-room-photos" : "hotel-photo-gallery"}>
    <RequestState resource={resource} loading={t("Loading photos…")} />
    {resource.status === "ready" && (photos.length ? <><div className="hotel-photo-mosaic" data-count={Math.min(photos.length, roomId ? 1 : 5)}>{photos.slice(0, roomId ? 1 : 5).map((photo, n) => <button key={photo.id} aria-label={t("View photo {{number}} of {{name}}", { number: n + 1, name })} onClick={() => { setIndex(n); setOpen(true); }}><HotelCover key={photo.url} url={photo.url} name={photo.altText || name} loading={n ? "lazy" : "eager"} /></button>)}</div><button className="outline-button hotel-all-photos" onClick={() => { setIndex(0); setOpen(true); }}>{t("Show all {{count}} photos", { count: photos.length })}</button></> : <HotelCover url={cover} name={name} />)}
    {open && selected && <Modal title={`${name} · ${index + 1} / ${photos.length}`} onClose={() => setOpen(false)} onKeyDown={event => { if (event.key === "ArrowLeft") setIndex(i => (i - 1 + photos.length) % photos.length); if (event.key === "ArrowRight") setIndex(i => (i + 1) % photos.length); }}><figure className="hotel-photo-viewer"><HotelCover key={selected.url} url={selected.url} name={selected.altText || name} /><figcaption>{selected.altText}</figcaption></figure><div className="hotel-photo-controls"><button className="outline-button" disabled={photos.length < 2} onClick={() => setIndex(i => (i - 1 + photos.length) % photos.length)}>{t("← Previous photo")}</button><button className="outline-button" disabled={photos.length < 2} onClick={() => setIndex(i => (i + 1) % photos.length)}>{t("Next photo →")}</button></div></Modal>}
  </div>;
}
