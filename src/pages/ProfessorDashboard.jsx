import React, { useState } from 'react';
import TestCreator from '../components/TestCreator';
import TestLibrary from '../components/TestLibrary';
import QuestionBank from '../components/QuestionBank';

const ProfessorDashboard = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setMessage({ text: '', type: '' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ text: 'Please select a file first.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`http://${window.location.hostname}:8000/api/professor/upload-excel`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: data.message, type: 'success' });
        setSelectedFile(null);
        document.getElementById('excel-upload').value = ''; 
      } else {
        setMessage({ text: data.detail || 'Failed to upload file.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred during upload. Is the backend running?', type: 'error' });
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (isActive) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
    color: isActive ? '#2563eb' : '#6b7280',
    fontWeight: isActive ? 'bold' : 'normal',
    backgroundColor: 'transparent',
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    fontSize: '16px'
  });

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>Professor Dashboard</h2>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
        <button style={tabStyle(activeTab === 'library')} onClick={() => setActiveTab('library')}>
          Test Library
        </button>
        <button style={tabStyle(activeTab === 'create')} onClick={() => setActiveTab('create')}>
          Create Test
        </button>
        <button style={tabStyle(activeTab === 'upload')} onClick={() => setActiveTab('upload')}>
          Question Bank
        </button>
      </div>

      {activeTab === 'upload' && (
        <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ marginTop: 0, color: '#4b5563' }}>Upload Question Bank</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>Upload an Excel file (.xlsx) containing your questions.</p>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <input 
              id="excel-upload"
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileChange}
              style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', flex: 1 }}
            />
            <button 
              onClick={handleUpload}
              disabled={loading || !selectedFile}
              style={{
                padding: '10px 20px',
                backgroundColor: (loading || !selectedFile) ? '#9ca3af' : '#2563eb',
                color: 'white', border: 'none', borderRadius: '6px',
                cursor: (loading || !selectedFile) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {message.text && (
            <div style={{ 
              marginTop: '20px', padding: '12px', borderRadius: '6px',
              backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}>
              {message.text}
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && <QuestionBank />}

      {activeTab === 'create' && <TestCreator />}
      
      {activeTab === 'library' && <TestLibrary />}
      
    </div>
  );
};

export default ProfessorDashboard;
