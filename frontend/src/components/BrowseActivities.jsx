import { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../api';
import { CATEGORIES } from '../constants';

function BrowseActivities({ onCreateClick, currentUserId, onViewProfile }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/activities`);
    const data = await res.json();
    setActivities(data);
    setLoading(false);
  };

  // Build the list of categories that actually exist, for the dropdown

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        searchText.trim() === '' ||
        activity.title.toLowerCase().includes(searchText.toLowerCase()) ||
        (activity.description || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (activity.location || '').toLowerCase().includes(searchText.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || activity.category === categoryFilter;

      const matchesGender =
        genderFilter === 'all' || activity.gender_restriction === genderFilter;

      const matchesDate =
        dateFilter === '' ||
        (activity.datetime && activity.datetime.startsWith(dateFilter));

      const isNotMine = activity.user_id !== currentUserId;

      return matchesSearch && matchesCategory && matchesGender && matchesDate && isNotMine;
    });
  }, [activities, searchText, categoryFilter, genderFilter, dateFilter]);

  const clearFilters = () => {
    setSearchText('');
    setCategoryFilter('all');
    setGenderFilter('all');
    setDateFilter('');
  };

  const filtersActive =
    searchText !== '' || categoryFilter !== 'all' || genderFilter !== 'all' || dateFilter !== '';

  return (
    <div>
      <div className="browse-header">
        <h2>Activities</h2>
        <button type="button" className="ghost-btn" onClick={onCreateClick}>
          + New
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by title, description, location..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
          <option value="all">Anyone can join</option>
          <option value="none">Everyone (no restriction)</option>
          <option value="male">Male only</option>
          <option value="female">Female only</option>
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        {filtersActive && (
          <button type="button" className="ghost-btn" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {loading && <p className="muted-text">Loading activities...</p>}

      {!loading && filteredActivities.length === 0 && (
        <div className="empty-state">
          <p>{activities.length === 0 ? 'No activities yet.' : 'No activities match your filters.'}</p>
          <button type="button" className="submit-btn" onClick={onCreateClick}>
            + Create a plan
          </button>
        </div>
      )}

      <ul className="activity-list">
        {filteredActivities.map((activity) => (
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
            <p className="meta">
              Created by{' '}
              <button type="button" className="link-btn" onClick={() => onViewProfile(activity.user_id)}>
                {activity.creator_display_name || activity.creator_name || 'Someone'}
              </button>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BrowseActivities;