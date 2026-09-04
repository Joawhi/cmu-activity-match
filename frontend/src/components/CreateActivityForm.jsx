import { useState } from 'react';
import { API_URL } from '../api';
import ActivityFields from './ActivityFields';

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
        <ActivityFields form={form} errors={errors} onChange={handleChange} />
        <button type="submit" className="submit-btn">Create activity</button>
      </form>
    </div>
  );
}

export default CreateActivityForm;