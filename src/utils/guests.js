export const DEFAULT_GUESTS = { adults: 2, children: 0, infants: 0 };
export const MAX_GUESTS = 16;

export const GUEST_TYPES = [
  { key: "adults", title: "Adults", description: "Ages 13 or above", singular: "adult", min: 1 },
  { key: "children", title: "Children", description: "Ages 2–12", singular: "child", min: 0 },
  { key: "infants", title: "Infants", description: "Ages 0–2", singular: "infant", min: 0 },
];

export function countGuests(guests) {
  return guests.adults + guests.children + guests.infants;
}

export function updateGuestCount(guests, type, amount) {
  const group = GUEST_TYPES.find((item) => item.key === type);
  if (!group) return guests;
  const count = guests[type] + amount;
  const total = countGuests(guests) + amount;
  if (count < group.min || total > MAX_GUESTS) return guests;
  return { ...guests, [type]: count };
}

export function guestBreakdown(guests) {
  return [
    `${guests.adults} adult${guests.adults === 1 ? "" : "s"}`,
    `${guests.children} ${guests.children === 1 ? "child" : "children"}`,
    `${guests.infants} infant${guests.infants === 1 ? "" : "s"}`,
  ].join(", ");
}
