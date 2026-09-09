import React, { useState } from 'react';

const ProfessorLogin = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://exam-backend-bog8.onrender.com/api/professor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        localStorage.setItem('username', username);
        onLogin();
      } else {
        const data = await response.json();
        setError(data.detail || 'Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred while communicating with the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex items-center justify-center">
      <div className="card w-full" style={{ maxWidth: '400px', margin: '1rem' }}>
        <div className="text-center mb-4">
          <h2>Professor Login</h2>
          <p className="text-muted">Sign in to manage your exams.</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="flex-col gap-3">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control"
              required 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Enter your username" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control"
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter your password" 
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary mt-2"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfessorLogin;
