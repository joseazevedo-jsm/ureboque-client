// Route inputs are snapshots of the live markers. Every new snapshot is a
// billed Directions request, so a moving driver only causes a new route when
// it has left the drawn one, or to refresh the ETA.
export const OFF_ROUTE_METRES = 75;
export const OFF_ROUTE_MIN_INTERVAL_MS = 30000;
export const ETA_REFRESH_MS = 5 * 60000;
const MIN_MOVE_METRES = 100;
const METRES_PER_DEGREE = 111320;

const isPoint = (p) => Number.isFinite(p?.latitude) && Number.isFinite(p?.longitude);

// Flat projection around the origin: accurate to well under a metre at the
// few-kilometre scale of a route segment.
function project(point, origin) {
  return {
    x: (point.longitude - origin.longitude) * METRES_PER_DEGREE * Math.cos(origin.latitude * Math.PI / 180),
    y: (point.latitude - origin.latitude) * METRES_PER_DEGREE,
  };
}

export function metresBetween(a, b) {
  const { x, y } = project(b, a);
  return Math.hypot(x, y);
}

// Shortest distance from a point to the polyline, measured to segments rather
// than vertices so long straight roads with sparse points do not read as off-route.
export function metresFromRoute(point, route) {
  const coordinates = (route || []).filter(isPoint);
  if (!isPoint(point) || coordinates.length === 0) return Infinity;
  if (coordinates.length === 1) return metresBetween(point, coordinates[0]);
  let best = Infinity;
  for (let i = 1; i < coordinates.length; i++) {
    const a = project(coordinates[i - 1], point);
    const b = project(coordinates[i], point);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, -(a.x * dx + a.y * dy) / lengthSquared));
    best = Math.min(best, Math.hypot(a.x + t * dx, a.y + t * dy));
  }
  return best;
}

export function nextRouteRequest(previous, points, now, routeCoordinates) {
  if (points.length !== 2 || points.some(p => !isPoint(p))) return null;
  const snapshot = () => ({ at: now, points: points.map(({ latitude, longitude }) => ({ latitude, longitude })) });
  if (!previous) return snapshot();

  const [origin, destination] = points;
  const changedDestination = destination.latitude !== previous.points[1].latitude || destination.longitude !== previous.points[1].longitude;
  if (changedDestination) return snapshot();

  const age = now - previous.at;
  const moved = metresBetween(origin, previous.points[0]);
  if (moved < MIN_MOVE_METRES) return previous;
  // Until the last request has drawn a route there is nothing to compare with.
  const offRoute = routeCoordinates?.length >= 2 && metresFromRoute(origin, routeCoordinates) > OFF_ROUTE_METRES;
  if (offRoute && age >= OFF_ROUTE_MIN_INTERVAL_MS) return snapshot();
  if (age >= ETA_REFRESH_MS) return snapshot();
  return previous;
}
