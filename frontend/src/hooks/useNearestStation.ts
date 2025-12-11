// src/hooks/useNearestStation.ts
import { useEffect, useState, useCallback } from "react";

/**
 * 368 個鄉鎮的中心點
 * 格式：
 * { city: "臺北市", district: "中山區", lat: 25.062, lon: 121.533 }
 */
const TOWNS: { city: string; district: string; lat: number; lon: number }[] = [
  { city: "臺北市", district: "中正區", lat: 25.0324, lon: 121.5191 },
  { city: "臺北市", district: "大同區", lat: 25.0630, lon: 121.5135 },
  { city: "臺北市", district: "中山區", lat: 25.0628, lon: 121.5334 },
  { city: "臺北市", district: "松山區", lat: 25.0605, lon: 121.5636 },
  { city: "臺北市", district: "大安區", lat: 25.0260, lon: 121.5435 },
  { city: "臺北市", district: "萬華區", lat: 25.0271, lon: 121.4973 },
  { city: "臺北市", district: "信義區", lat: 25.0306, lon: 121.5718 },
  { city: "臺北市", district: "士林區", lat: 25.0910, lon: 121.5240 },
  { city: "臺北市", district: "北投區", lat: 25.1322, lon: 121.5026 },
  { city: "臺北市", district: "內湖區", lat: 25.0830, lon: 121.5942 },
  { city: "臺北市", district: "南港區", lat: 25.0530, lon: 121.6065 },
  { city: "臺北市", district: "文山區", lat: 24.9982, lon: 121.5589 },


];

/** Haversine distance (公里) */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export function useNearestStation() {
  const [city, setCity] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** 找最近鄉鎮 */
  const locateTown = useCallback(
    (lat: number, lon: number) => {
      let nearest = TOWNS[0];
      let bestDist = Infinity;

      for (const t of TOWNS) {
        const d = haversine(lat, lon, t.lat, t.lon);
        if (d < bestDist) {
          bestDist = d;
          nearest = t;
        }
      }

      setCity(nearest.city);
      setDistrict(nearest.district);
    },
    []
  );

  /** 尋找 GPS */
  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("瀏覽器不支援 GPS");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setCoords({ lat, lon });
        locateTown(lat, lon);
        setLoading(false);
      },
      () => {
        setError("無法取得 GPS 位置，使用預設臺北市中正區");
        // ➜ 預設為臺北市中正區
        setCoords({ lat: 25.0324, lon: 121.5191 });
        locateTown(25.0324, 121.5191);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, [locateTown]);

  // 第一次啟動就抓 GPS
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    city,
    district,
    lat: coords?.lat,
    lon: coords?.lon,
    loading,
    error,
    refresh,
  };
}
