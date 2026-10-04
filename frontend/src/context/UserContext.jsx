import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

const STORAGE_KEY = 'cmu_activity_match_user';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setCurrentUser(JSON.parse(stored));
    setCheckedStorage(true);
  }, []);

  const persistUser = (user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const login = async (email, password) => {
    persistUser(await api.login(email, password));
  };

  const register = async (payload) => {
    persistUser(await api.register(payload));
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
  };

  const updateProfile = async ({ photoFile, ...fields }) => {
    await api.updateProfile(currentUser.id, fields);
    if (photoFile) {
      await api.uploadPhoto(currentUser.id, photoFile);
    }
    const refreshed = await api.getUser(currentUser.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
    setCurrentUser(refreshed);
  };

  const value = { currentUser, checkedStorage, login, register, logout, updateProfile };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}