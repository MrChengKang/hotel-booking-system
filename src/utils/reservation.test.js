import { calculateReservation } from "./reservation";

test("calculates the reference three-night quote and rounds the tax", () => {
  expect(calculateReservation(250, 3)).toEqual({ nights: 3, room: 750, cleaning: 45, service: 75, taxes: 69.6, total: 939.6 });
  expect(calculateReservation(179, 1)).toEqual({ nights: 1, room: 179, cleaning: 45, service: 17.9, taxes: 19.35, total: 261.25 });
});

test("requires a complete, positive-night stay", () => {
  expect(calculateReservation(250, 0)).toBeNull();
  expect(calculateReservation(250, -1)).toBeNull();
  expect(calculateReservation(250, NaN)).toBeNull();
});
