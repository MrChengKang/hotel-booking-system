import { useState } from "react";
import Modal from "../common/Modal";
import Icon from "../common/Icon";
import { photo } from "../../utils/images";

export default function HotelGallery({ hotel }) {
  const [active, setActive] = useState(null);
  const move = (amount) => setActive((current) => (current + amount + hotel.photos.length) % hotel.photos.length);
  function fallbackImage(event) {
    if (event.currentTarget.dataset.fallback) return;
    event.currentTarget.dataset.fallback = "true";
    event.currentTarget.src = photo(hotel.image, 1400);
  }
  return (
    <>
      <div className="hotel-photo-grid">
        {hotel.photos.map((image, index) => <button key={image} aria-label={`View hotel photo ${index + 1}`} onClick={() => setActive(index)}><img
          src={photo(image, index === 0 ? 1400 : 800)}
          alt={`${hotel.name}, view ${index + 1}`}
          onError={fallbackImage}
        />{index === 0 && <span className="hotel-show-photos">▦ Show all photos</span>}</button>)}
      </div>
      {active !== null && <Modal
        title={`Hotel photos · ${active + 1} / ${hotel.photos.length}`}
        onClose={() => setActive(null)}
        onKeyDown={(event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }}
      ><div className="hotel-lightbox"><button aria-label="Previous photo" onClick={() => move(-1)}><Icon name="chevron" /></button><img
        key={active}
        src={photo(hotel.photos[active], 1600)}
        alt={`${hotel.name}, view ${active + 1}`}
        onError={fallbackImage}
      /><button aria-label="Next photo" onClick={() => move(1)}><Icon name="chevron" /></button></div></Modal>}
    </>
  );
}
