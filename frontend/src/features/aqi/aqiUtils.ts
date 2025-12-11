// src/features/aqi/aqiUtils.ts
import type { StationRow, AqiCategory } from "./aqiTypes";

export function aqiClass(v: string | undefined): "g" | "m" | "u" {
  const n = Number(v);
  if (!v || Number.isNaN(n)) return "u";
  if (n <= 50) return "g";
  if (n <= 100) return "m";
  return "u";
}

export function getAqiCategory(aqi: string | number | null): AqiCategory | null {
  const n = Number(aqi);
  if (!Number.isFinite(n)) return null;
  if (n <= 50) return "good";
  if (n <= 100) return "moderate";
  if (n <= 150) return "usg";
  if (n <= 200) return "unhealthy";
  if (n <= 300) return "very";
  return "hazardous";
}

export function getAqiInfo(aqi: string | number | null) {
  const n = Number(aqi) || 0;
  if (n <= 50) return { label: "Good", className: "level-good" };
  if (n <= 100) return { label: "Moderate", className: "level-moderate" };
  if (n <= 150) return { label: "Unhealthy for Sensitive", className: "level-usg" };
  if (n <= 200) return { label: "Unhealthy", className: "level-unhealthy" };
  if (n <= 300) return { label: "Very Unhealthy", className: "level-very" };
  return { label: "Hazardous", className: "level-hazardous" };
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestStation(lat: number, lon: number, rows: StationRow[]) {
  let best: StationRow | null = null;
  let bestD = Infinity;

  for (const r of rows) {
    if (r.lat == null || r.lon == null) continue;
    const d = haversine(lat, lon, r.lat, r.lon);
    if (d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}
