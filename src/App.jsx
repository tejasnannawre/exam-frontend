import React, { useState } from 'react';
import ProfessorDashboard from './pages/ProfessorDashboard';
import StudentActiveTest from './pages/StudentActiveTest';
import ProfessorLogin from './pages/ProfessorLogin';

import axios from 'axios';
axios.defaults.baseURL = 'https://exam-backend-bog8.onrender.com';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const path = window.location.pathname;

  // Dynamic Route for Student Test
  if (path.startsWith('/test/')) {
    const testId = path.split('/')[2];
    if (testId) {
      return <StudentActiveTest testId={testId} />;
    }
  }

  // Professor Authentication Route
  if (!isAuthenticated) {
    return <ProfessorLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  // Default Admin Dashboard
  return (
    <div className="app-container">
      <main className="flex-col" style={{ flex: 1 }}>
        <ProfessorDashboard />
      </main>
    </div>
  );
}

export default App;