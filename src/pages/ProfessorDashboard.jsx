import React, { useState } from 'react';
import TestCreator from '../components/TestCreator';
import TestLibrary from '../components/TestLibrary';
import QuestionBank from '../components/QuestionBank';

const ProfessorDashboard = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

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

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    setPasswordMessage({ text: '', type: '' });
    
    try {
      const response = await fetch(`http://${window.location.hostname}:8000/api/professor/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPasswordMessage({ text: data.message || 'Password updated successfully.', type: 'success' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordMessage({ text: '', type: '' });
        }, 2000);
      } else {
        setPasswordMessage({ text: data.detail || 'Failed to update password.', type: 'error' });
      }
    } catch (error) {
      setPasswordMessage({ text: 'An error occurred. Is the backend running?', type: 'error' });
      console.error("Password update error:", error);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#333', margin: 0 }}>Professor Dashboard</h2>
        <button 
          onClick={() => setShowPasswordModal(true)} 
          style={{ padding: '8px 16px', backgroundColor: '#4b5563', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
        >
          Change Password
        </button>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb', marginBottom: '20px', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
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
      
      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#111827' }}>Change Password</h3>
            
            {passwordMessage.text && (
              <div style={{ padding: '10px', marginBottom: '15px', borderRadius: '6px', backgroundColor: passwordMessage.type === 'success' ? '#d1fae5' : '#fee2e2', color: passwordMessage.type === 'success' ? '#065f46' : '#991b1b', fontSize: '14px', border: `1px solid ${passwordMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}` }}>
                {passwordMessage.text}
              </div>
            )}
            
            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Current Password</label>
                <input 
                  type="password" required 
                  value={passwordForm.currentPassword} 
                  onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>New Password</label>
                <input 
                  type="password" required 
                  value={passwordForm.newPassword} 
                  onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Confirm New Password</label>
                <input 
                  type="password" required 
                  value={passwordForm.confirmPassword} 
                  onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', boxSizing: 'border-box' }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  style={{ padding: '10px 15px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ padding: '10px 15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorDashboard;
