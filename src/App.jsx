import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import ProfessorDashboard from './pages/ProfessorDashboard';
import StudentActiveTest from './pages/StudentActiveTest';
import Login from './pages/Login';
import Signup from './pages/Signup';

import axios from 'axios';
// Using the backend URL from the original code
axios.defaults.baseURL = 'http://127.0.0.1:8000'; // Set to localhost for testing the new features

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