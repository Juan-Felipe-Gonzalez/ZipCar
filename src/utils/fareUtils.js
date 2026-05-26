const BASE_FARE = 1000;
const RATE_PER_KM = 1300;

export const VEHICLE_OPTIONS = [
  { id: "economico", label: "Económico", multiplier: 1 },
  { id: "xl", label: "XL", multiplier: 1.15 },
  { id: "premium", label: "Premium", multiplier: 1.3 },
];

export function calculateBaseFare(distanceMeters) {
  const km = distanceMeters / 1000;
  return BASE_FARE + km * RATE_PER_KM;
}

export function calculateVehicleFare(baseFare, multiplier) {
  return baseFare * multiplier;
}

export function formatFare(amount) {
  const formatted = Number(amount).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
  return `$${formatted}`;
}
