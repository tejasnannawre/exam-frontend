import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('username', response.data.username);
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Network Error: Could not reach the backend server. Please check if Uvicorn is running.');
      } else {
        setError(err.response?.data?.detail || 'Invalid username or password');
      }
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
          
          <div className="text-center mt-4">
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
              Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>Sign up</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
