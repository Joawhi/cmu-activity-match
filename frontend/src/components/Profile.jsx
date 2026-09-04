import { useState, useEffect } from 'react';
import { API_URL, SERVER_URL } from '../api';
import { SCHOOL_YEARS, LANGUAGES } from '../constants';

function Profile({ userId, currentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);

  const isOwnProfile = currentUser.id === userId;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    setLoading(true);
    const res = await fetch(`${API_URL}/users/${userId}`);
    const data = await res.json();
    setProfile(data);
    setForm({
      display_name: data.display_name || '',
      bio: data.bio || '',
      school_year: data.school_year || '',
      major: data.major || '',
      languages: data.languages ? data.languages.split(',') : [],
    });
    setLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleLanguage = (lang) => {
    setForm((prev) => {
      const has = prev.languages.includes(lang);
      const languages = has ? prev.languages.filter((l) => l !== lang) : [...prev.languages, lang];
      return { ...prev, languages };
    });
  };

  const handleSave = async () => {
    setSaving(true);

    await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: form.display_name,
        bio: form.bio,
        school_year: form.school_year,
        major: form.major,
        languages: form.languages.join(','),
      }),
    });

    if (photoFile) {
      const formData = new FormData();
      formData.append('photo', photoFile);
      await fetch(`${API_URL}/users/${userId}/photo`, {
        method: 'POST',
        body: formData,
      });
    }

    setSaving(false);
    setPhotoFile(null);
    fetchProfile();
  };

  if (loading || !profile) {
    return <p className="muted-text">Loading profile...</p>;
  }

  return (
    <div className="profile-panel">
      <h2>{isOwnProfile ? 'My Profile' : (profile.display_name || profile.name)}</h2>

      <div className="profile-photo-row">
        {profile.profile_image ? (
          <img className="profile-photo" src={`${SERVER_URL}/uploads/${profile.profile_image}`} alt="Profile" />
        ) : (
          <div className="profile-photo placeholder">
            {(profile.display_name || profile.name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        {isOwnProfile && (
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
        )}
      </div>

      {isOwnProfile ? (
        <>
          <div className="form-row">
            <label htmlFor="display_name">Display name <span className="optional-label">(optional)</span></label>
            <input id="display_name" name="display_name" value={form.display_name} onChange={handleChange} placeholder={profile.name} />
          </div>

          <div className="form-row">
            <label htmlFor="bio">Short introduction <span className="optional-label">(optional)</span></label>
            <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} rows={3} placeholder="Tell people a bit about yourself" />
          </div>

          <div className="two-col">
            <div className="form-row">
              <label htmlFor="school_year">School year <span className="optional-label">(optional)</span></label>
              <select id="school_year" name="school_year" value={form.school_year} onChange={handleChange}>
                <option value="">Select</option>
                {SCHOOL_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="major">Major / program <span className="optional-label">(optional)</span></label>
              <input id="major" name="major" value={form.major} onChange={handleChange} placeholder="Computer Science" />
            </div>
          </div>

          <div className="form-row">
            <label>Preferred languages <span className="optional-label">(optional)</span></label>
            <div className="language-checkboxes">
              {LANGUAGES.map((lang) => (
                <label key={lang} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.languages.includes(lang)}
                    onChange={() => toggleLanguage(lang)}
                  />
                  {lang}
                </label>
              ))}
            </div>
          </div>

          <button type="button" className="submit-btn" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </>
      ) : (
        <>
          {profile.bio && <p>{profile.bio}</p>}
          {profile.school_year && <p className="meta">Year: {profile.school_year}</p>}
          {profile.major && <p className="meta">Major: {profile.major}</p>}
          {profile.languages && <p className="meta">Languages: {profile.languages.split(',').join(', ')}</p>}
        </>
      )}
    </div>
  );
}

export default Profile;