import { useState } from 'react';
import { API_URL } from '../api';
import { CATEGORIES } from '../constants';

const emptyForm = {
  title: '',
  description: '',
  datetime: '',
  location: '',
  max_people: '',
  category: '',
  gender_restriction: 'none',
};

function CreateActivityForm({ user }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [justCreated, setJustCreated] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setJustCreated(false);
  };

  const validate = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = 'Title is required.';
    }

    if (form.datetime) {
      const chosen = new Date(form.datetime);
      if (chosen < new Date()) {
        newErrors.datetime = 'Choose a date and time in the future.';
      }
    }

    if (form.max_people && Number(form.max_people) <= 0) {
      newErrors.max_people = 'Must be at least 1 person.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await fetch(`${API_URL}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, user_id: user.id }),
    });

    setForm(emptyForm);
    setErrors({});
    setJustCreated(true);
  };

  return (
    <div className="form-panel">
      <h2>Create an activity</h2>

      {justCreated && <div className="success-banner">✓ Activity created.</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Dinner at Legume" />
          {errors.title && <span className="field-error">{errors.title}</span>}
        </div>

        <div className="form-row">
          <label htmlFor="description">Description <span className="optional-label">(optional)</span></label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="What's the plan?" rows={3} />
        </div>

        <div className="two-col">
          <div className="form-row">
            <label htmlFor="datetime">Date & time <span className="optional-label">(optional)</span></label>
            <input id="datetime" name="datetime" type="datetime-local" value={form.datetime} onChange={handleChange} />
            {errors.datetime && <span className="field-error">{errors.datetime}</span>}
          </div>
          <div className="form-row">
            <label htmlFor="max_people">Max people <span className="optional-label">(optional)</span></label>
            <input id="max_people" name="max_people" type="number" min="1" value={form.max_people} onChange={handleChange} placeholder="6" />
            {errors.max_people && <span className="field-error">{errors.max_people}</span>}
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="location">Location <span className="optional-label">(optional)</span></label>
          <input id="location" name="location" value={form.location} onChange={handleChange} placeholder="Squirrel Hill" />
        </div>

        <div className="two-col">
          <div className="form-row">
            <label htmlFor="category">Category <span className="optional-label">(optional)</span></label>
            <select id="category" name="category" value={form.category} onChange={handleChange}>
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="gender_restriction">Who can join <span className="optional-label">(optional)</span></label>
            <select id="gender_restriction" name="gender_restriction" value={form.gender_restriction} onChange={handleChange}>
              <option value="none">Everyone</option>
              <option value="male">Male only</option>
              <option value="female">Female only</option>
            </select>
          </div>
        </div>

        <button type="submit" className="submit-btn">Create activity</button>
      </form>
    </div>
  );
}

export default CreateActivityForm;