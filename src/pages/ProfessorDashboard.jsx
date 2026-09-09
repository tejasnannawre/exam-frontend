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
      const response = await fetch('https://exam-backend-bog8.onrender.com/api/professor/upload-excel', {
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
      const response = await fetch('https://exam-backend-bog8.onrender.com/api/professor/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: localStorage.getItem('username') || 'admin',
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

  return (
    <div className="container">
      <div className="flex items-center justify-between mb-4">
        <h2 className="mb-0">Professor Dashboard</h2>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="btn btn-secondary"
        >
          Change Password
        </button>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
          Test Library
        </button>
        <button className={`tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
          Create Test
        </button>
        <button className={`tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
          Question Bank
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'upload' && (
          <div className="card mb-4 animate-fade-in">
            <h3>Upload Question Bank</h3>
            <p className="text-muted mb-3">Upload an Excel file (.xlsx) containing your questions.</p>

            <div className="flex gap-3 items-center flex-wrap">
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="form-control flex-grow"
                style={{ flex: '1 1 200px' }}
              />
              <button
                onClick={handleUpload}
                disabled={loading || !selectedFile}
                className="btn btn-primary"
              >
                {loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>

            {message.text && (
              <div className={`alert mt-3 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {message.text}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upload' && <div className="animate-fade-in"><QuestionBank /></div>}
        {activeTab === 'create' && <div className="animate-fade-in"><TestCreator /></div>}
        {activeTab === 'library' && <div className="animate-fade-in"><TestLibrary /></div>}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Change Password</h3>

            {passwordMessage.text && (
              <div className={`alert ${passwordMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="flex-col gap-3">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password" required
                  className="form-control"
                  value={passwordForm.currentPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password" required
                  className="form-control"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password" required
                  className="form-control"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>

              <div className="flex justify-between gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary w-full"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary w-full">
                  Update
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