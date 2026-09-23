import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/register', { 
        username, 
        password, 
        secret_code: secretCode 
      });
      setSuccess("Registration successful! You can now log in.");
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (!err.response) {
        setError('Network Error: Could not reach the backend server. Please check if Uvicorn is running.');
      } else {
        setError(err.response?.data?.detail || 'An error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container flex items-center justify-center" style={{ minHeight: '100vh', padding: '2rem 0' }}>
      <div className="card w-full" style={{ maxWidth: '400px', margin: '1rem' }}>
        <div className="text-center mb-4">
          <h2>Professor Registration</h2>
          <p className="text-muted">Create a new account.</p>
        </div>
        
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="flex-col gap-3">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-control"
              required 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Choose a username" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Institution Secret Code</label>
            <input 
              type="password" 
              className="form-control"
              required 
              value={secretCode} 
              onChange={e => setSecretCode(e.target.value)} 
              placeholder="Provided by administrator" 
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
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" 
              className="form-control"
              required 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              placeholder="Confirm your password" 
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary mt-2"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
          
          <div className="text-center mt-4">
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
