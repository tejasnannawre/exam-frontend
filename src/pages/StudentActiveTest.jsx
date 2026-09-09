import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const StudentActiveTest = ({ testId }) => {
  const [authStage, setAuthStage] = useState(true);
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  // Auth Form State
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Test Engine State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [reviewStatus, setReviewStatus] = useState({});
  const [visitedStatus, setVisitedStatus] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  const [warnings, setWarnings] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Anti-Cheat Engine
  const warningsRef = useRef(warnings);
  useEffect(() => {
    warningsRef.current = warnings;
  }, [warnings]);

  useEffect(() => {
    if (authStage || isDisqualified || testSubmitted) return;

    const issueWarning = (reason) => {
      const newWarnings = warningsRef.current + 1;
      setWarnings(newWarnings);
      
      if (newWarnings >= 3) {
        setIsDisqualified(true);
        submitTest(true);
      } else {
        alert(`WARNING ${newWarnings}/3: ${reason}\n\nOn the 3rd strike, your test will be terminated and submitted automatically.`);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        issueWarning("You switched tabs or minimized the browser.");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        issueWarning("You exited full-screen mode.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [authStage, isDisqualified, testSubmitted]);

  useEffect(() => {
    if (!authStage && questions.length > 0) {
      setVisitedStatus(prev => ({ ...prev, [currentQIndex]: true }));
    }
  }, [currentQIndex, authStage, questions]);

  const verifyPin = async (e) => {
    e.preventDefault();
    if (!name || !rollNumber || !pin) {
      setAuthError("Please fill out all fields.");
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await axios.post('/api/exam/verify-pin', {
        TestID: testId,
        PIN: pin,
        Name: name,
        RollNumber: rollNumber
      });
      
      setTestData(res.data);
      setQuestions(res.data.questions);
      setAuthStage(false);
      setVisitedStatus({ 0: true });

      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen mode:", err);
        alert("Please allow full-screen mode to take this test.");
      });

    } catch (err) {
      console.error(err);
      setAuthError(err.response?.data?.detail || "Invalid PIN or Test is not active.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAnswerSelect = (qId, optionLabel) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionLabel
    }));
  };

  const clearSelection = (qId) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[qId];
      return newAnswers;
    });
  };

  const toggleReview = () => {
    setReviewStatus(prev => ({
      ...prev,
      [currentQIndex]: !prev[currentQIndex]
    }));
  };

  const goToNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    }
  };

  const submitTest = async (forced = false) => {
    setShowSubmitModal(false);
    setSubmitting(true);
    try {
      const payload = {
        TestID: testId,
        Name: name,
        RollNumber: rollNumber,
        Answers: answers
      };
      
      const res = await axios.post('/api/exam/submit-test', payload);
      
      setTestSubmitted(true);
      setFinalScore(res.data);
      
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit test. Please contact your professor.");
    } finally {
      setSubmitting(false);
    }
  };

  if (testSubmitted) {
    return (
      <div className="flex-col items-center justify-center app-container" style={{ backgroundColor: '#f0fdf4', padding: '2rem' }}>
        <div className="card text-center" style={{ maxWidth: '500px', width: '100%', padding: '3rem 2rem' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 1.5rem auto' }}>
            <svg style={{ width: '40px', height: '40px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          
          <h1 style={{ color: '#166534', margin: '0 0 0.5rem 0' }}>Test Submitted!</h1>
          <p className="text-muted mb-4">Your responses have been securely saved.</p>
          
          {isDisqualified && (
            <div className="alert alert-error mb-4" style={{ fontWeight: '600' }}>
              Your test was automatically submitted because you violated the anti-cheat rules (3 strikes).
            </div>
          )}
          
          <div className="flex justify-center gap-4 mb-4">
            <div className="text-right">
              <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>Student</p>
              <p style={{ margin: 0, fontWeight: '600' }}>{name}</p>
            </div>
            <div style={{ width: '1px', backgroundColor: 'var(--border)' }}></div>
            <div className="text-left">
              <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem' }}>Roll Number</p>
              <p style={{ margin: 0, fontWeight: '600' }}>{rollNumber}</p>
            </div>
          </div>
          
          <div style={{ padding: '2rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <p className="text-muted" style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Final Score</p>
            <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '3rem', fontWeight: '800' }}>
              {finalScore?.score} <span className="text-muted" style={{ fontSize: '1.5rem' }}>/ {finalScore?.total}</span>
            </h2>
          </div>
          
          <p className="text-muted mt-4" style={{ fontSize: '0.875rem' }}>You may now safely close this window.</p>
        </div>
      </div>
    );
  }

  if (authStage) {
    return (
      <div className="flex items-center justify-center app-container">
        <div className="card" style={{ maxWidth: '400px', width: '100%', margin: '1rem' }}>
          <h2 className="text-center mb-4">Join Examination</h2>
          {authError && <div className="alert alert-error">{authError}</div>}
          
          <form onSubmit={verifyPin} className="flex-col gap-3">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-control" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input type="text" className="form-control" required value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="MCA-001" />
            </div>
            <div className="form-group">
              <label className="form-label">4-Digit Test PIN</label>
              <input type="text" className="form-control text-center" required maxLength={4} value={pin} onChange={e => setPin(e.target.value)} placeholder="----" style={{ fontSize: '1.5rem', letterSpacing: '0.5em' }} />
            </div>
            
            <button type="submit" disabled={authLoading} className="btn btn-primary mt-2">
              {authLoading ? 'Verifying...' : 'Enter Test'}
            </button>
            <p className="text-muted text-center mt-2" style={{ fontSize: '0.75rem' }}>
              This test uses Anti-Cheat. Upon entering, your browser will be forced into Full-Screen mode.
            </p>
          </form>
        </div>
      </div>
    );
  }

  const total = questions.length;
  let answeredCount = 0;
  let reviewCount = 0;
  let notAnsweredCount = 0;
  let notVisitedCount = 0;

  questions.forEach((q, i) => {
    const qId = q._id || q.id;
    if (reviewStatus[i]) {
      reviewCount++;
    } else if (answers[qId]) {
      answeredCount++;
    } else if (visitedStatus[i]) {
      notAnsweredCount++;
    } else {
      notVisitedCount++;
    }
  });

  const getStatusColor = (index) => {
    const qId = questions[index]._id || questions[index].id;
    if (reviewStatus[index]) return '#f97316'; // Orange: Review
    if (answers[qId]) return '#10b981'; // Green: Answered
    if (visitedStatus[index]) return '#ef4444'; // Red: Unanswered
    return '#94a3b8'; // Gray: Not Visited
  };

  const q = questions[currentQIndex];
  
  return (
    <div className="app-container">
      {/* Header */}
      <div className="flex justify-between items-center" style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{testData?.test_name}</h2>
          <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Student: {name} ({rollNumber})</div>
        </div>
        <div className="flex items-center gap-3">
          <div style={{ backgroundColor: warnings > 0 ? '#fef2f2' : '#f1f5f9', color: warnings > 0 ? 'var(--danger)' : 'var(--text-muted)', padding: '0.5rem 1rem', borderRadius: '9999px', fontWeight: '600', fontSize: '0.875rem' }}>
            Strikes: {warnings} / 3
          </div>
          <button onClick={() => setShowSubmitModal(true)} disabled={submitting} className="btn" style={{ backgroundColor: '#9333ea', color: 'white' }}>
            Submit Exam
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', overflow: 'hidden' }}>
        
        {/* Left Side: Question Area */}
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          <div style={{ padding: '2rem', flex: 1 }}>
            <div className="card animate-fade-in" style={{ height: '100%' }}>
              <div className="flex justify-between items-center mb-4">
                <span className="text-muted" style={{ fontWeight: '600' }}>Question {currentQIndex + 1} of {questions.length}</span>
                <span style={{ backgroundColor: '#f1f5f9', color: 'var(--text-main)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: '600' }}>{q.Unit}</span>
              </div>

              <h3 style={{ fontSize: '1.25rem', lineHeight: '1.5', marginBottom: '2rem' }}>{q.Question}</h3>

              <div className="flex-col gap-3 mb-4">
                {['Option_A', 'Option_B', 'Option_C', 'Option_D'].map((optKey, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const val = q[optKey];
                  const qId = q._id || q.id;
                  const isSelected = answers[qId] === label;
                  
                  return (
                    <div 
                      key={optKey}
                      onClick={() => handleAnswerSelect(qId, label)}
                      style={{
                        padding: '1rem',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.05)' : 'var(--surface)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: isSelected ? 'var(--primary)' : '#f1f5f9', color: isSelected ? 'white' : 'var(--text-muted)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '600' }}>
                        {label}
                      </div>
                      <div style={{ flex: 1 }}>{val}</div>
                    </div>
                  );
                })}
              </div>

              {answers[q._id || q.id] && (
                <button 
                  onClick={() => clearSelection(q._id || q.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div style={{ backgroundColor: 'var(--surface)', padding: '1rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <button 
              onClick={goToPrevious}
              disabled={currentQIndex === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>

            <button 
              onClick={toggleReview}
              className="btn"
              style={{ backgroundColor: reviewStatus[currentQIndex] ? '#fff7ed' : 'var(--surface)', color: '#ea580c', border: '1px solid #f97316' }}
            >
              {reviewStatus[currentQIndex] ? 'Unmark Review' : 'Mark for Review'}
            </button>
            
            <button 
              onClick={currentQIndex === questions.length - 1 ? () => setShowSubmitModal(true) : goToNext}
              className="btn btn-primary"
            >
              {currentQIndex === questions.length - 1 ? 'Submit Test' : 'Save & Next'}
            </button>
          </div>
        </div>

        {/* Right Side: Palette Sidebar */}
        <div style={{ flex: '1 1 300px', maxWidth: '100%', backgroundColor: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
            <h3 className="mb-3">Question Palette</h3>
            
            <div className="grid grid-cols-2 gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-2"><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></div> Answered ({answeredCount})</div>
              <div className="flex items-center gap-2"><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f97316' }}></div> Review ({reviewCount})</div>
              <div className="flex items-center gap-2"><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div> Skipped ({notAnsweredCount})</div>
              <div className="flex items-center gap-2"><div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></div> Not Visited ({notVisitedCount})</div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '0.5rem' }}>
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQIndex(i)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(i),
                    color: 'white',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    boxShadow: currentQIndex === i ? '0 0 0 3px var(--text-main) inset' : 'none',
                    opacity: currentQIndex !== i && !visitedStatus[i] ? 0.7 : 1,
                    transition: 'var(--transition)'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-3">Submit Exam?</h2>
            
            <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
              <div className="flex justify-between mb-2">
                <span className="text-muted">Total Questions:</span>
                <span style={{ fontWeight: '600' }}>{total}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: '#059669' }}>Answered:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>{answeredCount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: '#ea580c' }}>Marked for Review:</span>
                <span style={{ fontWeight: '600', color: '#ea580c' }}>{reviewCount}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#dc2626' }}>Unanswered / Skipped:</span>
                <span style={{ fontWeight: '600', color: '#dc2626' }}>{notAnsweredCount + notVisitedCount}</span>
              </div>
            </div>

            <p className="text-muted mb-4" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
              Are you sure you want to submit? You will not be able to change your answers after submission.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setShowSubmitModal(false)} className="btn btn-secondary w-full">
                Go Back
              </button>
              <button onClick={() => submitTest(false)} className="btn w-full" style={{ backgroundColor: '#9333ea', color: 'white' }}>
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default StudentActiveTest;