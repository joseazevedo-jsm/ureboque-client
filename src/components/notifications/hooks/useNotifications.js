import { useState } from 'react';
import { useUserData } from '../../../context/UserDataContext';

export const useNotifications = () => {
  const { notifications, fetchUserNotifications, markNotificationAsRead, deleteNotification } = useUserData();
  const [isLoading, setIsLoading] = useState(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      await fetchUserNotifications();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch {}
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
    } catch {}
  };

  return { notifications, isLoading, refresh, handleMarkRead, handleDelete };
};
