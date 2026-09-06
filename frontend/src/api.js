export const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const API_URL = `${SERVER_URL}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
}

export const api = {
  login: (name, email) =>
    request('/users/login', { method: 'POST', body: JSON.stringify({ name, email }) }),

  getUser: (id) => request(`/users/${id}`),

  updateProfile: (id, fields) =>
    request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(fields) }),

  uploadPhoto: async (id, file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_URL}/users/${id}/photo`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Could not upload photo');
    return res.json();
  },

  getActivities: (viewerId) => request(`/activities?viewer_id=${viewerId}`),

  createActivity: (payload) =>
    request('/activities', { method: 'POST', body: JSON.stringify(payload) }),

  updateActivity: (id, payload) =>
    request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deleteActivity: (id, userId) =>
    request(`/activities/${id}?user_id=${userId}`, { method: 'DELETE' }),

  applyToActivity: (id, userId, note) =>
    request(`/activities/${id}/apply`, { method: 'POST', body: JSON.stringify({ user_id: userId, note }) }),

  getApplications: (activityId, creatorId) =>
    request(`/activities/${activityId}/applications?user_id=${creatorId}`),

  respondToApplication: (applicationId, status, creatorId) =>
    request(`/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({ status, creator_id: creatorId }),
    }),
};