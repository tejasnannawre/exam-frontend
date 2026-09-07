import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const TestLibrary = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null); // { testID, pin }

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

  const handleDelete = async (testId) => {
    if (window.confirm("Are you sure you want to delete this test? This action cannot be undone.")) {
      try {
        await axios.delete(`/api/exam/tests/${testId}`);
        setTests(prev => prev.filter(t => t._id !== testId));
      } catch (err) {
        console.error('Error deleting test:', err);
        alert('Failed to delete test.');
      }
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{ color: '#4b5563', marginBottom: '20px' }}>Test Library</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {loading ? (
        <p>Loading tests...</p>
      ) : tests.length === 0 ? (
        <p>No tests created yet.</p>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%', display: 'block' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead style={{ backgroundColor: '#f3f4f6', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '12px 15px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Test Name</th>
                <th style={{ padding: '12px 15px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Division</th>
                <th style={{ padding: '12px 15px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Date Created</th>
                <th style={{ padding: '12px 15px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                <th style={{ padding: '12px 15px', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map(test => (
                <tr key={test._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 15px', color: '#111827' }}>{test.TestName}</td>
                  <td style={{ padding: '12px 15px', color: '#6b7280' }}>{test.Division}</td>
                  <td style={{ padding: '12px 15px', color: '#6b7280' }}>
                    {test.CreatedAt ? new Date(test.CreatedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: test.Status === 'active' ? '#d1fae5' : test.Status === 'completed' ? '#f3f4f6' : '#fef3c7',
                      color: test.Status === 'active' ? '#065f46' : test.Status === 'completed' ? '#374151' : '#92400e'
                    }}>
                      {(test.Status || 'draft').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {(test.Status === 'draft' || !test.Status) && (
                      <button 
                        onClick={() => updateStatus(test._id, 'active', test.PIN)}
                        style={{ padding: '6px 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Publish to Class
                      </button>
                    )}
                    {test.Status === 'active' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => setActiveModal({ testID: test._id, pin: test.PIN })}
                          style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                          Show QR
                        </button>
                        <button 
                          onClick={() => updateStatus(test._id, 'completed')}
                          style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                        >
                          End Exam
                        </button>
                      </div>
                    )}
                    {test.Status === 'completed' && (
                      <button 
                        onClick={() => handleDownload(test._id)}
                        style={{ padding: '6px 12px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                      >
                        Download Results
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(test._id)}
                      style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* QR Code Modal */}
      {activeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', zIndex: 50
        }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            <h2 style={{ color: '#10b981', marginTop: 0 }}>Exam is Live!</h2>
            <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', margin: '20px 0' }}>
              <h1 style={{ fontSize: '48px', margin: '0 0 10px 0', color: '#1f2937', letterSpacing: '5px' }}>{activeModal.pin}</h1>
              <p style={{ color: '#6b7280', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Test PIN</p>
            </div>
            <div style={{ padding: '20px', border: '2px dashed #d1d5db', borderRadius: '8px', marginBottom: '20px', display: 'inline-block' }}>
              <QRCodeSVG value={`${window.location.origin}/test/${activeModal.testID}`} size={200} level="H" />
            </div>
            <div>
              <button 
                onClick={() => setActiveModal(null)}
                style={{ padding: '10px 20px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestLibrary;
