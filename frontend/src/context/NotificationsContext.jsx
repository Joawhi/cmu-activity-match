import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { useUser } from './UserContext';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { currentUser } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const data = await api.getNotifications(currentUser.id);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch {
      // A failed poll keeps the last list. The next refresh tries again.
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refreshNotifications();
    const intervalId = window.setInterval(refreshNotifications, 20000);
    return () => window.clearInterval(intervalId);
  }, [currentUser, refreshNotifications]);

  const markNotificationRead = async (id) => {
    await api.markNotificationRead(id, currentUser.id);
    setNotifications((current) => current.map((item) => (
      item.id === id && !item.read_at ? { ...item, read_at: new Date().toISOString() } : item
    )));
    setUnreadCount((current) => {
      const wasUnread = notifications.some((item) => item.id === id && !item.read_at);
      return wasUnread ? Math.max(0, current - 1) : current;
    });
  };

  const markAllNotificationsRead = async () => {
    await api.markAllNotificationsRead(currentUser.id);
    const now = new Date().toISOString();
    setNotifications((current) => current.map((item) => (
      item.read_at ? item : { ...item, read_at: now }
    )));
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
