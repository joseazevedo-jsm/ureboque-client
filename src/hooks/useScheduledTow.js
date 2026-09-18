import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import api from '../services/APIService';
import { useLogger } from './useLogger';

// The client's upcoming tow booked for later (at most one), for the home card.
export const useScheduledTow = ({ enabled, socket, onActivatedRef }) => {
  const logger = useLogger('useScheduledTow');
  const [scheduledTow, setScheduledTow] = useState(null);
  const knownRef = useRef(null);
  const inFlightRef = useRef(false);
  const generationRef = useRef(0);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const refresh = useCallback(async () => {
    if (!enabledRef.current || inFlightRef.current) return;
    const generation = generationRef.current;
    const account = enabledRef.current;
    const isCurrent = () => enabledRef.current === account && generationRef.current === generation;
    inFlightRef.current = true;
    try {
      const { data } = await api.get('/service/scheduled/mine');
      if (!isCurrent()) return;
      const next = Array.isArray(data) && data.length ? data[0] : null;
      const previous = knownRef.current;
      if (!next && previous?._id) {
        // The upcoming endpoint stops returning a booking at dispatch. Fetch
        // its final/active state before removing the card, even after a lost event.
        const { data: service } = await api.get(`/service/${previous._id}`);
        if (!isCurrent()) return;
        if (service?.status === 'scheduled') return;
        onActivatedRef?.current?.(service);
      }
      knownRef.current = next;
      setScheduledTow(next);
    } catch (error) {
      logger.warn('Could not load scheduled tow', error);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const cancel = useCallback(async (serviceId) => {
    await api.put(`/service/scheduled/${serviceId}/cancel`);
    generationRef.current += 1;
    knownRef.current = null;
    setScheduledTow(null);
  }, []);

  useEffect(() => {
    generationRef.current += 1;
    knownRef.current = null;
    setScheduledTow(null);
    if (!enabled) {
      knownRef.current = null;
      setScheduledTow(null);
      return undefined;
    }
    refresh();
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    const timer = setInterval(() => { if (AppState.currentState === 'active') refresh(); }, 15000);
    return () => { generationRef.current += 1; sub.remove(); clearInterval(timer); };
  }, [enabled, refresh]);

  // A driver claiming it, or the dispatch sweep starting it, publishes a snapshot.
  useEffect(() => {
    if (!socket) return undefined;
    const onSnapshot = (payload) => {
      if (scheduledTow?._id && String(payload?.idService) === String(scheduledTow._id)) refresh();
    };
    socket.on('serviceSnapshot', onSnapshot);
    socket.on('connect', refresh);
    return () => { socket.off('serviceSnapshot', onSnapshot); socket.off('connect', refresh); };
  }, [socket, scheduledTow?._id, refresh]);

  return { scheduledTow, refreshScheduledTow: refresh, cancelScheduledTow: cancel };
};
