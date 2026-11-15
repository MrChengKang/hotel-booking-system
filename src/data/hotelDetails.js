export function getHotelDetails(hotel) {
  return {
    ...hotel,
    capacity: Math.max(2, hotel.beds * 2),
    bedrooms: 1,
    bathrooms: 1,
    description: `A comfortable ${hotel.roomType || "hotel room"} in ${hotel.city}, with a welcoming space to unwind after a day in the city. Enjoy a restful night, thoughtful room amenities and help from the hotel’s guest services team.`,
    photos: [...new Set([hotel.image, "photo-1611892440504-42a792e24d32", "photo-1616594039964-ae9021a400a0", "photo-1571896349842-33c89424de2d", "photo-1566665797739-1674de7a421a", "photo-1540518614846-7eded433c457"])].slice(0, 5),
  };
}

export const hotelAmenities = [
  ["Air conditioning", "wind"], ["Heating", "sun"], ["Wifi", "wifi"],
  ["Towels and bed linen", "bed"], ["Hair dryer", "wind"], ["Coffee maker", "coffee"],
  ["Smart TV", "monitor"], ["Dedicated workspace", "monitor"], ["Iron and hangers", "clipboard"],
  ["Luggage storage", "clipboard"], ["Guest services", "user"],
];

export const sampleHotelReviews = [
  { id: 1, name: "Sophie Walker", rating: 5, date: "2026-09-28", image: "photo-1500648767791-00dcc994a43e", text: "The room looked just like the photos. The hotel team made check-in easy and we had a lovely stay. We would book again." },
  { id: 2, name: "Risa Mori", rating: 5, date: "2026-09-12", image: "photo-1534528741775-53994a69daeb", text: "A quiet, comfortable room and helpful staff. A great base for exploring the city." },
  { id: 3, name: "Eden Birch", rating: 4, date: "2026-08-22", image: "photo-1524504388940-b1c1722653e1", text: "Clean rooms, a comfortable bed and a friendly welcome. We enjoyed our weekend here." },
];
