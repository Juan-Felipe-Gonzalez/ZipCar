// utils/useDriverSimulation.js

import { useState, useEffect, useRef } from "react";
import { decodePolyline } from "./decodePolyline";

const toRad = (deg) => (deg * Math.PI) / 180;

function getBearing(from, to) {
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function interpolateRoute(coords, stepMeters = 20) {
  const R = 6371000;
  const result = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const from = coords[i];
    const to = coords[i + 1];
    const dLat = toRad(to.latitude - from.latitude);
    const dLon = toRad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(from.latitude)) *
        Math.cos(toRad(to.latitude)) *
        Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const steps = Math.max(1, Math.round(dist / stepMeters));
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      result.push({
        latitude: from.latitude + (to.latitude - from.latitude) * t,
        longitude: from.longitude + (to.longitude - from.longitude) * t,
      });
    }
  }
  result.push(coords[coords.length - 1]);
  return result;
}

// Genera un punto aleatorio entre minKm y maxKm del origen
function randomNearbyPoint(center, minKm = 1, maxKm = 3) {
  const distKm = minKm + Math.random() * (maxKm - minKm);
  const angleDeg = Math.random() * 360;
  const angleRad = toRad(angleDeg);
  const deltaLat = (distKm / 111) * Math.cos(angleRad);
  const deltaLng =
    (distKm / (111 * Math.cos(toRad(center.latitude)))) * Math.sin(angleRad);
  return {
    latitude: center.latitude + deltaLat,
    longitude: center.longitude + deltaLng,
  };
}

export function useDriverSimulation(userLocation, active, apiKey, intervalMs = 1500) {
  const [driverPosition, setDriverPosition] = useState(null);
  const [driverHeading, setDriverHeading] = useState(0);
  const [arrived, setArrived] = useState(false);

  const indexRef = useRef(0);
  const pointsRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active || !userLocation || !apiKey) return;

    let cancelled = false;

    const init = async () => {
      // Punto de partida aleatorio entre 300m y 1km del usuario
      const driverStart = randomNearbyPoint(userLocation, 0.3, 0.9);

      // Ruta real por calles desde el punto del conductor hasta el usuario
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${driverStart.latitude},${driverStart.longitude}&destination=${userLocation.latitude},${userLocation.longitude}&key=${apiKey}&language=es`;

      const res = await fetch(url);
      const data = await res.json();

      const encoded = data.routes?.[0]?.overview_polyline?.points;
      if (!encoded || cancelled) return;

      const decoded = decodePolyline(encoded);
      const interpolated = interpolateRoute(decoded, 20);

      pointsRef.current = interpolated;
      indexRef.current = 0;
      setDriverPosition(interpolated[0]);
      setArrived(false);

      timerRef.current = setInterval(() => {
        const idx = indexRef.current;
        const points = pointsRef.current;

        if (idx >= points.length - 1) {
          clearInterval(timerRef.current);
          setArrived(true);
          return;
        }

        const next = points[idx + 1];
        setDriverHeading(getBearing(points[idx], next));
        setDriverPosition(next);
        indexRef.current = idx + 1;
      }, intervalMs);
    };

    init();

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [active, apiKey]);
  // No incluyas userLocation en deps — no quieres reiniciar si el GPS del usuario se mueve

  return { driverPosition, driverHeading, arrived };
}