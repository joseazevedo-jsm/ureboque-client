// Map defaults
export const MAP_LATITUDE_DELTA = 0.006;
export const MAP_LONGITUDE_DELTA = 0.013;

// Driver search
export const DRIVER_SEARCH_RADIUS_M = 5000;
export const DRIVER_POLL_INTERVAL_MS = 20000;
export const DRIVER_ARRIVAL_THRESHOLD_KM = 0.3;
export const DRIVER_MOVE_THRESHOLD_M = 10;

// Timers
// How long a tow requested now searches for a driver. Matches the API's
// service.searchWindowMs (5 min).
export const SEARCH_TIMER_DURATION_S = 300;

// Caches
export const GEOCODE_CACHE_MAX = 50;
export const DISTANCE_CACHE_MAX = 50;
