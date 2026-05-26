const DIRECTIONS_BASE_URL = "https://maps.googleapis.com/maps/api/directions/json";

export async function fetchDirections(origin, destination, apiKey) {
  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    key: apiKey,
    language: "es",
  });

  const response = await fetch(`${DIRECTIONS_BASE_URL}?${params}`);
  const data = await response.json();

  if (data.status !== "OK" || !data.routes?.length) {
    return null;
  }

  const route = data.routes[0];
  const leg = route.legs?.[0];

  return {
    encodedPolyline: route.overview_polyline?.points ?? "",
    distance: leg?.distance ?? null,
    duration: leg?.duration ?? null,
  };
}
