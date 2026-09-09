import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const StudentActiveTest = ({ testId }) => {
  const [authStage, setAuthStage] = useState(true); // true = auth screen, false = test screen
  const [testData, setTestData] = useState(null); // the verified test data
  const [questions, setQuestions] = useState([]);
  
  // Auth Form State
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Test Engine State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [q._id]: "A", "B", etc. }
  const [reviewStatus, setReviewStatus] = useState({}); // { [index]: boolean }
  const [visitedStatus, setVisitedStatus] = useState({}); // { [index]: boolean }
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
        submitTest(true); // force submit on disqualify
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

  // Mark current question as visited
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

      // Force Fullscreen
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
      console.log("Submitting Payload: ", payload);
      
      const res = await axios.post('/api/exam/submit-test', payload);
      
      setTestSubmitted(true);
      setFinalScore(res.data);
      
      // Exit fullscreen if possible
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0fdf4', padding: '20px', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '50px', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', maxWidth: '500px', width: '100%' }}>
          
          <div style={{ width: '80px', height: '80px', backgroundColor: '#dcfce7', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 24px auto' }}>
            <svg style={{ width: '40px', height: '40px', color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          
          <h1 style={{ color: '#166534', margin: '0 0 10px 0', fontSize: '28px', fontWeight: '800' }}>Test Submitted!</h1>
          <p style={{ color: '#4b5563', fontSize: '16px', marginBottom: '30px' }}>Your responses have been securely saved.</p>
          
          {isDisqualified && (
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '15px', borderRadius: '8px', marginBottom: '25px', fontWeight: '600', fontSize: '14px', border: '1px solid #f87171' }}>
              Your test was automatically submitted because you violated the anti-cheat rules (3 strikes).
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Student</p>
              <p style={{ margin: 0, fontSize: '16px', color: '#1f2937', fontWeight: '600' }}>{name}</p>
            </div>
            <div style={{ width: '1px', backgroundColor: '#e5e7eb' }}></div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Roll Number</p>
              <p style={{ margin: 0, fontSize: '16px', color: '#1f2937', fontWeight: '600' }}>{rollNumber}</p>
            </div>
          </div>
          
          <div style={{ padding: '30px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Final Score</p>
            <h2 style={{ margin: '10px 0 0 0', fontSize: '48px', color: '#0f172a', fontWeight: '800' }}>{finalScore?.score} <span style={{ fontSize: '24px', color: '#94a3b8' }}>/ {finalScore?.total}</span></h2>
          </div>
          
          <p style={{ marginTop: '30px', color: '#94a3b8', fontSize: '14px' }}>You may now safely close this window.</p>
        </div>
      </div>
    );
  }

  if (authStage) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ textAlign: 'center', color: '#111827', margin: '0 0 30px 0' }}>Join Examination</h2>
          {authError && <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{authError}</div>}
          
          <form onSubmit={verifyPin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} placeholder="John Doe" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Roll Number</label>
              <input type="text" required value={rollNumber} onChange={e => setRollNumber(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box' }} placeholder="MCA-001" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>4-Digit Test PIN</label>
              <input type="text" required maxLength={4} value={pin} onChange={e => setPin(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }} placeholder="----" />
            </div>
            
            <button type="submit" disabled={authLoading} style={{ padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: authLoading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
              {authLoading ? 'Verifying...' : 'Enter Test'}
            </button>
            <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0 }}>This test uses Anti-Cheat. Upon entering, your browser will be forced into Full-Screen mode.</p>
          </form>
        </div>
      </div>
    );
  }

  // Calculate stats for sidebar
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
    if (reviewStatus[index]) return '#f97316'; // Orange: Marked for Review
    if (answers[qId]) return '#16a34a'; // Green: Answered
    if (visitedStatus[index]) return '#ef4444'; // Red: Unanswered / Skipped
    return '#9ca3af'; // Gray: Not Visited Yet
  };

  // Active Test UI
  const q = questions[currentQIndex];
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f3f4f6' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>{testData?.test_name}</h2>
          <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '5px' }}>Student: {name} ({rollNumber})</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ backgroundColor: warnings > 0 ? '#fee2e2' : '#f3f4f6', color: warnings > 0 ? '#dc2626' : '#6b7280', padding: '8px 16px', borderRadius: '9999px', fontWeight: 'bold', fontSize: '14px' }}>
            Strikes: {warnings} / 3
          </div>
          <button onClick={() => setShowSubmitModal(true)} disabled={submitting} style={{ padding: '10px 20px', backgroundColor: '#9333ea', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Submit Exam
          </button>
        </div>
      </div>

      {/* Main Body (Flex wrap for mobile responsiveness) */}
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', overflow: 'hidden' }}>
        
        {/* Left Side: Question Area (75% width on desktop) */}
        <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          <div style={{ padding: '30px', flex: 1 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ color: '#4b5563', fontSize: '16px', fontWeight: 'bold' }}>Question {currentQIndex + 1} of {questions.length}</span>
                <span style={{ backgroundColor: '#e5e7eb', color: '#374151', padding: '4px 10px', borderRadius: '6px', fontSize: '14px', fontWeight: '600' }}>{q.Unit}</span>
              </div>

              <h3 style={{ fontSize: '20px', color: '#1f2937', lineHeight: '1.5', marginBottom: '30px' }}>{q.Question}</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                {['Option_A', 'Option_B', 'Option_C', 'Option_D'].map((optKey, idx) => {
                  const label = String.fromCharCode(65 + idx); // A, B, C, D
                  const val = q[optKey];
                  const qId = q._id || q.id;
                  const isSelected = answers[qId] === label;
                  
                  return (
                    <div 
                      key={optKey}
                      onClick={() => handleAnswerSelect(qId, label)}
                      style={{
                        padding: '16px',
                        border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                        backgroundColor: isSelected ? '#eff6ff' : 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: isSelected ? '#3b82f6' : '#f3f4f6', color: isSelected ? 'white' : '#4b5563', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>
                        {label}
                      </div>
                      <div style={{ fontSize: '16px', color: '#374151', flex: 1 }}>{val}</div>
                    </div>
                  );
                })}
              </div>

              {answers[q._id || q.id] && (
                <button 
                  onClick={() => clearSelection(q._id || q.id)}
                  style={{ background: 'none', border: 'none', color: '#6b7280', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px' }}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div style={{ backgroundColor: 'white', padding: '20px 30px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <button 
              onClick={goToPrevious}
              disabled={currentQIndex === 0}
              style={{ padding: '12px 24px', backgroundColor: currentQIndex === 0 ? '#f3f4f6' : 'white', color: currentQIndex === 0 ? '#9ca3af' : '#4b5563', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: 'bold', cursor: currentQIndex === 0 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>

            <button 
              onClick={toggleReview}
              style={{ padding: '12px 24px', backgroundColor: reviewStatus[currentQIndex] ? '#fff7ed' : 'white', color: '#ea580c', border: '1px solid #f97316', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {reviewStatus[currentQIndex] ? 'Unmark Review' : 'Mark for Review'}
            </button>
            
            <button 
              onClick={currentQIndex === questions.length - 1 ? () => setShowSubmitModal(true) : goToNext}
              style={{ padding: '12px 24px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {currentQIndex === questions.length - 1 ? 'Submit Test' : 'Save & Next'}
            </button>
          </div>
        </div>

        {/* Right Side: Palette Sidebar (25% width on desktop) */}
        <div style={{ flex: '1 1 300px', maxWidth: '100%', backgroundColor: 'white', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
          
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1f2937', fontSize: '18px' }}>Question Palette</h3>
            
            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#4b5563' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#16a34a' }}></div> Answered ({answeredCount})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f97316' }}></div> Review ({reviewCount})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div> Skipped ({notAnsweredCount})</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#9ca3af' }}></div> Not Visited ({notVisitedCount})</div>
            </div>
          </div>

          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(45px, 1fr))', gap: '10px' }}>
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQIndex(i)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(i),
                    color: 'white',
                    border: currentQIndex === i ? '3px solid #1f2937' : 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    boxShadow: currentQIndex === i ? '0 0 0 2px white inset' : 'none'
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#111827' }}>Submit Exam?</h2>
            
            <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#4b5563' }}>Total Questions:</span>
                <span style={{ fontWeight: 'bold', color: '#111827' }}>{total}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#16a34a' }}>Answered:</span>
                <span style={{ fontWeight: 'bold', color: '#16a34a' }}>{answeredCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#ea580c' }}>Marked for Review:</span>
                <span style={{ fontWeight: 'bold', color: '#ea580c' }}>{reviewCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#ef4444' }}>Unanswered / Skipped:</span>
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{notAnsweredCount + notVisitedCount}</span>
              </div>
            </div>

            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '25px' }}>
              Are you sure you want to submit? You will not be able to change your answers after submission.
            </p>

            <div style={{ display: 'flex', gap: '15px' }}>
              <button onClick={() => setShowSubmitModal(false)} style={{ flex: 1, padding: '12px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', color: '#374151', fontWeight: 'bold', cursor: 'pointer' }}>
                Go Back
              </button>
              <button onClick={() => {
                submitTest(false);
              }} style={{ flex: 1, padding: '12px', backgroundColor: '#9333ea', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
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