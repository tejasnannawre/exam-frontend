import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import ConfirmModal from './ConfirmModal';

const TestLibrary = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null); // { testID, pin }
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmColor: '#2563eb' // Not heavily used now since we have classes
  });

  const openConfirm = (title, message, onConfirm, confirmText = 'Confirm', confirmColor = 'primary') => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      },
      confirmText,
      confirmColor // Map to 'primary', 'success', 'danger'
    });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/exam/tests');
      setTests(response.data);
    } catch (err) {
      setError('Failed to fetch tests.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const updateStatus = async (testId, newStatus, pin) => {
    if (newStatus === 'active') {
      openConfirm(
        "Publish Test",
        "Are you sure you want to publish this test? Students will be able to access it.",
        () => performUpdateStatus(testId, newStatus, pin),
        "Publish",
        "success"
      );
      return;
    }
    
    if (newStatus === 'completed') {
      openConfirm(
        "End Exam",
        "Are you sure you want to end this exam? Students will no longer be able to submit.",
        () => performUpdateStatus(testId, newStatus, pin),
        "End Exam",
        "danger"
      );
      return;
    }

    performUpdateStatus(testId, newStatus, pin);
  };

  const performUpdateStatus = async (testId, newStatus, pin) => {
    try {
      await axios.put(`/api/exam/tests/${testId}/status`, { status: newStatus });
      fetchTests();
      if (newStatus === 'active' && pin) {
        setActiveModal({ testID: testId, pin });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status.');
    }
  };

  const handleDownload = (testId) => {
    window.open(`http://${window.location.hostname}:8000/api/exam/tests/${testId}/export`, '_blank');
  };

  const handleDelete = (testId) => {
    openConfirm(
      "Delete Test",
      "Are you sure you want to delete this test? This action cannot be undone.",
      async () => {
        try {
          await axios.delete(`/api/exam/tests/${testId}`);
          setTests(prev => prev.filter(t => t._id !== testId));
        } catch (err) {
          console.error('Error deleting test:', err);
          alert('Failed to delete test.');
        }
      },
      "Delete",
      "danger"
    );
  };

  return (
    <div className="animate-fade-in card">
      <h3 className="mb-3">Test Library</h3>
      {error && <div className="alert alert-error">{error}</div>}
      
      {loading ? (
        <p className="text-muted text-center" style={{ padding: '2rem' }}>Loading tests...</p>
      ) : tests.length === 0 ? (
        <p className="text-muted text-center" style={{ padding: '2rem' }}>No tests created yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead style={{ backgroundColor: '#f1f5f9' }}>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Test Name</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Division</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Date Created</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Status</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(test => (
                <tr key={test._id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{test.TestName}</td>
                  <td className="text-muted" style={{ padding: '1rem' }}>{test.Division}</td>
                  <td className="text-muted" style={{ padding: '1rem' }}>
                    {test.CreatedAt ? new Date(test.CreatedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: test.Status === 'active' ? '#d1fae5' : test.Status === 'completed' ? '#f1f5f9' : '#fef3c7',
                      color: test.Status === 'active' ? '#059669' : test.Status === 'completed' ? '#475569' : '#b45309'
                    }}>
                      {(test.Status || 'draft').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div className="flex gap-2 items-center flex-wrap">
                      {(test.Status === 'draft' || !test.Status) && (
                        <button 
                          onClick={() => updateStatus(test._id, 'active', test.PIN)}
                          className="btn btn-success" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          Publish to Class
                        </button>
                      )}
                      {test.Status === 'active' && (
                        <>
                          <button 
                            onClick={() => setActiveModal({ testID: test._id, pin: test.PIN })}
                            className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            Show QR
                          </button>
                          <button 
                            onClick={() => updateStatus(test._id, 'completed')}
                            className="btn btn-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            End Exam
                          </button>
                        </>
                      )}
                      {test.Status === 'completed' && (
                        <button 
                          onClick={() => handleDownload(test._id)}
                          className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                        >
                          Download Results
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(test._id)}
                        className="btn" 
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Modal */}
      {activeModal && (
        <div className="modal-overlay">
          <div className="modal-content text-center">
            <h2 className="mb-0" style={{ color: 'var(--success)' }}>Exam is Live!</h2>
            <div style={{ padding: '1.5rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', margin: '1.5rem 0' }}>
              <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', letterSpacing: '0.2em' }}>{activeModal.pin}</h1>
              <p className="text-muted" style={{ margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Test PIN</p>
            </div>
            <div style={{ padding: '1rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', display: 'inline-block', marginBottom: '1.5rem', backgroundColor: 'white' }}>
              <QRCodeSVG value={`${window.location.origin}/test/${activeModal.testID}`} size={200} level="H" />
            </div>
            <button 
              onClick={() => setActiveModal(null)}
              className="btn btn-secondary w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
        confirmText={confirmConfig.confirmText}
        confirmColor={confirmConfig.confirmColor}
      />
    </div>
  );
};

export default TestLibrary;
