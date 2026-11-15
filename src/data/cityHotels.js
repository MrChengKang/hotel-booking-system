import { destinations } from "./destinations";
import { stays } from "./stays";

const rooms = [
  { roomType: "Standard room", beds: 1, price: 145, image: "photo-1566665797739-1674de7a421a" },
  { roomType: "Deluxe room", beds: 2, price: 210, image: "photo-1611892440504-42a792e24d32" },
  { roomType: "Suite", beds: 2, price: 320, image: "photo-1616594039964-ae9021a400a0" },
  { roomType: "Family room", beds: 3, price: 265, image: "photo-1540518614846-7eded433c457" },
];

// Additional hotel rooms are illustrative inventory, not live availability.
export const allCityHotels = destinations.flatMap((destination) => {
  const city = destination.name.split(",")[0];
  const existing = stays.filter((stay) => stay.city === city).map((stay) => ({ ...stay, roomType: "Standard room" }));
  const examples = rooms.slice(existing.length).map((room, index) => ({
    ...room,
    id: `${destination.slug}-${index}`,
    name: `${city} ${room.roomType} Hotel`,
    city,
    type: "Hotel room",
    address: `${city} city centre`,
    rating: 4.6 + (index % 3) / 10,
    reviews: 35 + index * 21,
    sale: index === 0,
  }));
  return [...existing, ...examples];
});

export function getCityHotels(destination) {
  return allCityHotels.filter((hotel) => hotel.city === destination.name.split(",")[0]);
}
