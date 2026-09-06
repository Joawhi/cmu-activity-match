import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const STORAGE_KEY = 'cmu_activity_match_user';

const AppContext = createContext(null);

// Converts a raw activity row from the backend into the shape the UI expects.
function mapActivity(raw) {
  return {
    id: raw.id,
    hostId: raw.user_id,
    hostName: raw.creator_display_name || raw.creator_name || 'Someone',
    hostPhoto: raw.creator_photo || null,
    title: raw.title,
    description: raw.description || '',
    category: raw.category,
    date: raw.datetime,
    location: raw.location || '',
    capacity: raw.max_people || 0,
    whoCanJoin: raw.gender_restriction || 'none',
    myApplicationStatus: raw.my_application_status,
    applicationCount: raw.application_count || 0,
    acceptedCount: raw.accepted_count || 0,
    createdAt: raw.created_at,
  };
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUserId, setProfileUserId] = useState(null);
  const [requestsByActivity, setRequestsByActivity] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setCurrentUser(JSON.parse(stored));
    setCheckedStorage(true);
  }, []);

  const fetchActivities = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const raw = await api.getActivities(currentUser.id);
      setActivities(raw.map(mapActivity));
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) fetchActivities();
  }, [currentUser, fetchActivities]);

  const login = async (name, email) => {
    const user = await api.login(name, email);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
    setActivities([]);
  };

  const createActivity = async (input) => {
    await api.createActivity({ ...input, user_id: currentUser.id });
    await fetchActivities();
  };

  const updateActivity = async (id, input) => {
    await api.updateActivity(id, { ...input, user_id: currentUser.id });
    await fetchActivities();
  };

  const deleteActivity = async (id) => {
    await api.deleteActivity(id, currentUser.id);
    await fetchActivities();
  };

  const sendJoinRequest = async (activityId, note) => {
    await api.applyToActivity(activityId, currentUser.id, note);
    await fetchActivities();
  };

  const loadRequests = async (activityId) => {
    const rows = await api.getApplications(activityId, currentUser.id);
    setRequestsByActivity((prev) => ({ ...prev, [activityId]: rows }));
  };

  const getRequestsForActivity = (activityId) => requestsByActivity[activityId];

  const respondToRequest = async (activityId, applicationId, status) => {
    await api.respondToApplication(applicationId, status, currentUser.id);
    await loadRequests(activityId);
    await fetchActivities();
  };

  const acceptRequest = (activityId, applicationId) => respondToRequest(activityId, applicationId, 'accepted');
  const declineRequest = (activityId, applicationId) => respondToRequest(activityId, applicationId, 'declined');

  const updateProfile = async ({ photoFile, ...fields }) => {
    await api.updateProfile(currentUser.id, fields);
    if (photoFile) {
      await api.uploadPhoto(currentUser.id, photoFile);
    }
    const refreshed = await api.getUser(currentUser.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
    setCurrentUser(refreshed);
  };

  const openProfile = (id) => setProfileUserId(id);
  const closeProfile = () => setProfileUserId(null);

  const value = {
    currentUser,
    checkedStorage,
    login,
    logout,
    activities,
    loading,
    createActivity,
    updateActivity,
    deleteActivity,
    sendJoinRequest,
    getRequestsForActivity,
    loadRequests,
    acceptRequest,
    declineRequest,
    updateProfile,
    profileUserId,
    openProfile,
    closeProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}