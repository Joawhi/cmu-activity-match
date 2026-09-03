import { useState, useEffect } from 'react';
import { API_URL } from '../api';

function MyActivities({ user }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <h2>My Activities</h2>
      <p className="muted-text">Editing and deleting your activities is coming in a future sprint.</p>

      {loading && <p className="muted-text">Loading...</p>}

      {!loading && activities.length === 0 && (
        <div className="empty-state">
          <p>You haven't created any activities yet.</p>
        </div>
      )}

      <ul className="activity-list">
        {activities.map((activity) => (
          <li key={activity.id} className="activity-item">
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
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MyActivities;