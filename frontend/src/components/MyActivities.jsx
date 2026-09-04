import { useState, useEffect } from 'react';
import { API_URL } from '../api';
import ActivityFields from './ActivityFields';

function MyActivities({ user }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editErrors, setEditErrors] = useState({});

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
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MyActivities;