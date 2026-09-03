import { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    datetime: '',
    location: '',
    max_people: '',
    category: '',
    gender_restriction: 'none',
  });

  // Load activities from the backend when the page opens
  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    const res = await fetch(`${API_URL}/activities`);
    const data = await res.json();
    setActivities(data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title) {
      alert('Title is required');
      return;
    }

    await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    // Reset the form and refresh the list
    setForm({
      title: '',
      description: '',
      datetime: '',
      location: '',
      max_people: '',
      category: '',
      gender_restriction: 'none',
    });
    fetchActivities();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>CMU Activity Match</h1>

      <h2>Create an activity</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          name="title"
          placeholder="Title"
          value={form.title}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
        />
        <input
          name="datetime"
          type="datetime-local"
          value={form.datetime}
          onChange={handleChange}
        />
        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
        />
        <input
          name="max_people"
          type="number"
          placeholder="Max number of people"
          value={form.max_people}
          onChange={handleChange}
        />
        <input
          name="category"
          placeholder="Category (e.g. Food, Museum, Games)"
          value={form.category}
          onChange={handleChange}
        />
        <select name="gender_restriction" value={form.gender_restriction} onChange={handleChange}>
          <option value="none">No restriction</option>
          <option value="male">Male only</option>
          <option value="female">Female only</option>
        </select>
        <button type="submit">Create activity</button>
      </form>

      <h2>Activities</h2>
      {activities.length === 0 && <p>No activities yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {activities.map((activity) => (
          <li key={activity.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', marginBottom: '10px' }}>
            <strong>{activity.title}</strong>
            <p>{activity.description}</p>
            <p>📍 {activity.location} — 🗓️ {activity.datetime}</p>
            <p>Category: {activity.category} | Max people: {activity.max_people}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;