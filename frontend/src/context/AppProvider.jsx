import { UserProvider, useUser } from './UserContext';
import { ActivitiesProvider, useActivities } from './ActivitiesContext';
import { ProfileModalProvider, useProfileModal } from './ProfileModalContext';

// Composes the three smaller contexts and re-exposes them as one combined
// hook, so every existing component that calls useApp() keeps working
// completely unchanged.
export function AppProvider({ children }) {
  return (
    <UserProvider>
      <ActivitiesProvider>
        <ProfileModalProvider>{children}</ProfileModalProvider>
      </ActivitiesProvider>
    </UserProvider>
  );
}

export function useApp() {
  const user = useUser();
  const activities = useActivities();
  const profileModal = useProfileModal();
  return { ...user, ...activities, ...profileModal };
}