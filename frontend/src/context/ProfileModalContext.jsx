import { createContext, useContext, useState } from 'react';

const ProfileModalContext = createContext(null);

export function ProfileModalProvider({ children }) {
  const [profileUserId, setProfileUserId] = useState(null);

  const openProfile = (id) => setProfileUserId(id);
  const closeProfile = () => setProfileUserId(null);

  const value = { profileUserId, openProfile, closeProfile };

  return <ProfileModalContext.Provider value={value}>{children}</ProfileModalContext.Provider>;
}

export function useProfileModal() {
  const ctx = useContext(ProfileModalContext);
  if (!ctx) throw new Error('useProfileModal must be used within ProfileModalProvider');
  return ctx;
}