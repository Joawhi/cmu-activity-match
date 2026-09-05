import { useState, useEffect } from 'react';
import { API_URL } from '../api';
import ActivityFields from './ActivityFields';

function MyActivities({ user }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [viewingApplicationsId, setViewingApplicationsId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  useEffect(() => {
    fetchMyActivities();
  }, []);

  const fetchMyActivities = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/activities`);
    const data = await res.json();
    setActivities(data.filter((a) => a.user_id === user.id));
    setLoading(false);
  };

  const startEditing = (activity) => {
    setEditingId(activity.id);
    setEditForm({
      title: activity.title || '',
      description: activity.description || '',
      datetime: activity.datetime || '',
      location: activity.location || '',
      max_people: activity.max_people || '',
      category: activity.category || '',
      gender_restriction: activity.gender_restriction || 'none',
    });
    setEditErrors({});
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm(null);
    setEditErrors({});
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const validateEdit = () => {
    const newErrors = {};
    if (!editForm.title.trim()) {
      newErrors.title = 'Title is required.';
    }
    if (editForm.max_people && Number(editForm.max_people) <= 0) {
      newErrors.max_people = 'Must be at least 1 person.';
    }
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveEdit = async (id) => {
    if (!validateEdit()) {
      return;
    }

    await fetch(`${API_URL}/activities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, user_id: user.id }),
    });

    cancelEditing();
    fetchMyActivities();
  };

  const deleteActivity = async (id) => {
    const confirmed = window.confirm('Delete this activity? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    await fetch(`${API_URL}/activities/${id}?user_id=${user.id}`, {
      method: 'DELETE',
    });

    fetchMyActivities();
  };

  const toggleApplications = async (activityId) => {
    if (viewingApplicationsId === activityId) {
      setViewingApplicationsId(null);
      return;
    }

    setViewingApplicationsId(activityId);
    setLoadingApplications(true);
    const res = await fetch(`${API_URL}/activities/${activityId}/applications?user_id=${user.id}`);
    const data = await res.json();
    setApplications(data);
    setLoadingApplications(false);
  };

  const respondToApplication = async (applicationId, status) => {
    await fetch(`${API_URL}/applications/${applicationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, creator_id: user.id }),
    });

    const res = await fetch(`${API_URL}/activities/${viewingApplicationsId}/applications?user_id=${user.id}`);
    const data = await res.json();
    setApplications(data);
    fetchMyActivities();
  };

  return (
    <div>
      <h2>My Activities</h2>

      {loading && <p className="muted-text">Loading...</p>}

      {!loading && activities.length === 0 && (
        <div className="empty-state">
          <p>You haven't created any activities yet.</p>
        </div>
      )}

      <ul className="activity-list">
        {activities.map((activity) => (
          <li key={activity.id} className="activity-item">
            {editingId === activity.id ? (
              <div className="inline-edit">
                <ActivityFields form={editForm} errors={editErrors} onChange={handleEditChange} />
                <div className="edit-actions">
                  <button type="button" className="submit-btn" onClick={() => saveEdit(activity.id)}>Save</button>
                  <button type="button" className="ghost-btn" onClick={cancelEditing}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h3>{activity.title}</h3>
                {activity.description && <p>{activity.description}</p>}
                <p className="meta">
                  {activity.location && `📍 ${activity.location}`}
                  {activity.datetime && ` — 🗓️ ${new Date(activity.datetime).toLocaleString()}`}
                </p>
                <p className="meta">
                  {activity.category && `${activity.category}`}
                  {activity.max_people && ` · up to ${activity.max_people} people`}
                </p>

                <div className="edit-actions">
                  <button type="button" className="ghost-btn" onClick={() => startEditing(activity)}>Edit</button>
                  <button type="button" className="ghost-btn danger" onClick={() => deleteActivity(activity.id)}>Delete</button>
                  {activity.application_count > 0 && (
                    <button type="button" className="ghost-btn" onClick={() => toggleApplications(activity.id)}>
                      {viewingApplicationsId === activity.id ? 'Hide requests' : `View requests (${activity.application_count})`}
                    </button>
                  )}
                </div>

                {viewingApplicationsId === activity.id && (
                  <div className="applications-panel">
                    {loadingApplications && <p className="muted-text">Loading requests...</p>}
                    {!loadingApplications && applications.map((app) => (
                      <div key={app.id} className="application-row">
                        <div>
                          <strong>{app.applicant_display_name || app.applicant_name}</strong>
                          {app.note && <p className="meta">"{app.note}"</p>}
                        </div>
                        {app.status === 'pending' ? (
                          <div className="edit-actions">
                            <button type="button" className="submit-btn" onClick={() => respondToApplication(app.id, 'accepted')}>Accept</button>
                            <button type="button" className="ghost-btn danger" onClick={() => respondToApplication(app.id, 'declined')}>Decline</button>
                          </div>
                        ) : (
                          <span className="application-status">
                            {app.status === 'accepted' ? '✓ Accepted' : 'Declined'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MyActivities;