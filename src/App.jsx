import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import ProfessorDashboard from './pages/ProfessorDashboard';
import StudentActiveTest from './pages/StudentActiveTest';
import Login from './pages/Login';
import Signup from './pages/Signup';

import axios from 'axios';
// Set default backend URL to the live Render server
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://exam-backend-bog8.onrender.com';

// Add a request interceptor to include the JWT token in all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 Unauthorized errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Wrapper for StudentActiveTest since it expects testId as a prop
function StudentActiveTestWrapper() {
  const { testId } = useParams();
  return <StudentActiveTest testId={testId} />;
}

function App() {
  return (
    <Router>
      <div className="app-container">
        <main className="flex-col" style={{ flex: 1 }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Student Dynamic Route (No Professor Auth Required) */}
            <Route path="/test/:testId" element={<StudentActiveTestWrapper />} />

            {/* Protected Routes */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <ProfessorDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;