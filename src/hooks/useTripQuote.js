import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/APIService';
import { useLogger } from './useLogger';

const isValidCoordinate = (point) => Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude);

// The server's price for the current route, for every tow type. The app shows
// these and books with them; it never works a price out itself.
export const useTripQuote = ({ markers, directions }) => {
  const logger = useLogger('useTripQuote');
  const [quote, setQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(false);
  const sequenceRef = useRef(0);

  const pickup = markers?.[0];
  const dropoff = markers?.[1];
  const distanceKm = Number(directions?.distance);
  const durationMin = Number(directions?.duration);
  const ready = isValidCoordinate(pickup) && isValidCoordinate(dropoff) && Number.isFinite(distanceKm);

  const fetchQuote = useCallback(async () => {
    const sequence = ++sequenceRef.current;
    if (!ready) {
      setQuote(null);
      setQuoteError(false);
      return;
    }
    setQuoteError(false);
    try {
      const { data } = await api.post('/prices/quote', {
        locations: [
          { coordinates: { latitude: pickup.latitude, longitude: pickup.longitude } },
          { coordinates: { latitude: dropoff.latitude, longitude: dropoff.longitude } },
        ],
        route: { distanceKm, durationMin: Number.isFinite(durationMin) ? durationMin : undefined },
      });
      if (sequence === sequenceRef.current) setQuote(data);
    } catch (error) {
      logger.warn('Could not quote the trip', error?.response?.data || error?.message);
      // The server's code when it refused the trip (OUTSIDE_ANGOLA), else true.
      if (sequence === sequenceRef.current) setQuoteError(error?.response?.data?.code || true);
    }
  }, [ready, pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude, distanceKm, durationMin]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  return { quote, quoteError, fetchQuote };
};
