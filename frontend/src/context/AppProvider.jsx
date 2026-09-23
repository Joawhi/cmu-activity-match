import { UserProvider, useUser } from './UserContext';
import { ActivitiesProvider, useActivities } from './ActivitiesContext';
import { NotificationsProvider, useNotifications } from './NotificationsContext';
import { ProfileModalProvider, useProfileModal } from './ProfileModalContext';
import { ChatProvider, useChat } from './ChatContext';

// Composes the smaller contexts and re-exposes them as one combined
// hook, so every existing component that calls useApp() keeps working
// completely unchanged.
export function AppProvider({ children }) {
  return (
    <UserProvider>
      <ActivitiesProvider>
        <NotificationsProvider>
          <ProfileModalProvider>
            <ChatProvider>{children}</ChatProvider>
          </ProfileModalProvider>
        </NotificationsProvider>
      </ActivitiesProvider>
    </UserProvider>
  );
}

export function useApp() {
  const user = useUser();
  const activities = useActivities();
  const notifications = useNotifications();
  const profileModal = useProfileModal();
  const chat = useChat();
  return { ...user, ...activities, ...notifications, ...profileModal, ...chat };
}