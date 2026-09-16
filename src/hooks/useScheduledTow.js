import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import api from '../services/APIService';
import { useLogger } from './useLogger';

// The client's upcoming tow booked for later (at most one), for the home card.
export const useScheduledTow = ({ enabled, socket }) => {
  const logger = useLogger('useScheduledTow');
  const [scheduledTow, setScheduledTow] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/service/scheduled/mine');
      setScheduledTow(Array.isArray(data) && data.length ? data[0] : null);
    } catch (error) {
      logger.warn('Could not load scheduled tow', error);
    }
  }, []);

  const cancel = useCallback(async (serviceId) => {
    await api.put(`/service/scheduled/${serviceId}/cancel`);
    setScheduledTow(null);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    refresh();
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
    return () => sub.remove();
  }, [enabled, refresh]);

  // A driver claiming it, or the dispatch sweep starting it, publishes a snapshot.
  useEffect(() => {
    if (!socket || !scheduledTow?._id) return undefined;
    const onSnapshot = (payload) => {
      if (String(payload?.idService) === String(scheduledTow._id)) refresh();
    };
    socket.on('serviceSnapshot', onSnapshot);
    return () => socket.off('serviceSnapshot', onSnapshot);
  }, [socket, scheduledTow?._id, refresh]);

  return { scheduledTow, refreshScheduledTow: refresh, cancelScheduledTow: cancel };
};
