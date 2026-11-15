export function calculateReservation(nightlyPrice, nights) {
  if (!Number.isInteger(nights) || nights <= 0) return null;
  const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
  const room = round(nightlyPrice * nights);
  const cleaning = 45;
  const service = round(room * .1);
  const taxes = round((room + cleaning + service) * .08);
  return { nights, room, cleaning, service, taxes, total: round(room + cleaning + service + taxes) };
}
