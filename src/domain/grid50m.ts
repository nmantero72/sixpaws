const EARTH_RADIUS_M = 6378137;
const CELL_SIZE_M = 50;
const MIN_LAT = -85;
const MAX_LAT = 85;

function clampLat(lat: number): number {
  if (lat < MIN_LAT) {
    return MIN_LAT;
  }

  if (lat > MAX_LAT) {
    return MAX_LAT;
  }

  return lat;
}

export function cellId50m(lat: number, lon: number): string {
  const safeLat = clampLat(lat);
  const x = (lon * Math.PI / 180) * EARTH_RADIUS_M;
  const y = Math.log(Math.tan(Math.PI / 4 + safeLat * Math.PI / 360)) * EARTH_RADIUS_M;

  const gx = Math.floor(x / CELL_SIZE_M);
  const gy = Math.floor(y / CELL_SIZE_M);

  return `g50:${gx}:${gy}`;
}
