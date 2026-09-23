import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useUser } from './UserContext';

const ActivitiesContext = createContext(null);

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
    budgetTotal: Number(raw.budget_total) || 0,
    budgetNote: raw.budget_note || '',
    transportMethod: raw.transport_method || null,
    transportNote: raw.transport_note || '',
    durationHours: raw.duration_hours == null ? null : Number(raw.duration_hours),
    applicationDeadline: raw.application_deadline || null,
    requirements: raw.participation_requirements || '',
    status: raw.status || 'active',
    myApplicationStatus: raw.my_application_status,
    applicationCount: raw.application_count || 0,
    acceptedCount: raw.accepted_count || 0,
    createdAt: raw.created_at,
  };
}

export function ActivitiesProvider({ children }) {
  const { currentUser } = useUser();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsByActivity, setRequestsByActivity] = useState({});

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
    if (currentUser) {
      fetchActivities();
    } else {
      setActivities([]);
    }
  }, [currentUser, fetchActivities]);

  const createActivity = async (input) => {
    await api.createActivity({ ...input, user_id: currentUser.id });
    await fetchActivities();
  };

  const updateActivity = async (id, input) => {
    await api.updateActivity(id, { ...input, user_id: currentUser.id });
    await fetchActivities();
  };

  const cancelActivity = async (id) => {
    await api.cancelActivity(id, currentUser.id);
    await fetchActivities();
  };

  const deleteActivity = cancelActivity;

  const sendJoinRequest = async (activityId, note) => {
    await api.applyToActivity(activityId, currentUser.id, note);
    await fetchActivities();
  };

  const withdrawJoinRequest = async (activityId) => {
    await api.withdrawApplication(activityId, currentUser.id);
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

  const value = {
    activities,
    loading,
    createActivity,
    updateActivity,
    cancelActivity,
    deleteActivity,
    sendJoinRequest,
    withdrawJoinRequest,
    getRequestsForActivity,
    loadRequests,
    acceptRequest,
    declineRequest,
  };

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>;
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext);
  if (!ctx) throw new Error('useActivities must be used within ActivitiesProvider');
  return ctx;
}