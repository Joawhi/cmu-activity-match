import { useState } from 'react';
import { API_URL } from '../api';

function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Please enter your name and CMU email.');
      return;
    }

    const lowerEmail = email.toLowerCase();
    if (!lowerEmail.endsWith('@andrew.cmu.edu') && !lowerEmail.endsWith('@cmu.edu')) {
      setError('Please use your CMU email address.');
      return;
    }

    const res = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    if (!res.ok) {
      setError('Something went wrong. Please try again.');
      return;
    }

    const user = await res.json();
    onLogin(user);
  };

  return (
    <div className="login-panel">
      <h2>Welcome</h2>
      <p className="muted-text">Enter your name and CMU email to continue.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="name">Name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
        </div>
        <div className="form-row">
          <label htmlFor="email">CMU email</label>
          <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jdoe@andrew.cmu.edu" />
        </div>
        {error && <span className="field-error">{error}</span>}
        <button type="submit" className="submit-btn">Continue</button>
      </form>
    </div>
  );
}

export default Login;