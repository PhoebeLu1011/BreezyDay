// src/features/aqi/aqiTypes.ts
export interface StationRow {
  county: string;
  site: string;
  aqi: string;          // 原本就是字串
  pm25: number | null;
  pm10: number | null;
  o3: number | null;
  so2: number | null;
  status: string;
  publishTime: string;
  lat: number | null;
  lon: number | null;
}

export type AqiCategory =
  | "good"
  | "moderate"
  | "usg"
  | "unhealthy"
  | "very"
  | "hazardous";

export type SortKey = "aqi" | "pm25" | "pm10" | "site";
