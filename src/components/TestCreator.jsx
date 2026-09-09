import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const TestCreator = () => {
  const [testName, setTestName] = useState('');
  const [division, setDivision] = useState('');
  const [randomized, setRandomized] = useState(true);
  
  const [availableUnits, setAvailableUnits] = useState([]);
  const [subtopicsCache, setSubtopicsCache] = useState({});
  
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]); // array of IDs
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await axios.get('/api/exam/units');
        setAvailableUnits(response.data.units || []);
      } catch (error) {
        console.error("Error fetching units:", error);
      }
    };
    fetchUnits();
  }, []);

  const fetchSubtopicsForUnit = async (unit) => {
    if (!unit || subtopicsCache[unit]) return;
    try {
      const response = await axios.get(`/api/exam/subtopics/${encodeURIComponent(unit)}`);
      setSubtopicsCache(prev => ({ ...prev, [unit]: response.data.subtopics || [] }));
    } catch (error) {
      console.error(`Error fetching subtopics for ${unit}:`, error);
    }
  };

  const handleUnitChange = (e) => {
    const unit = e.target.value;
    setSelectedUnit(unit);
    setSelectedSubtopic('');
    setAvailableQuestions([]);
    if (unit) {
      fetchSubtopicsForUnit(unit);
    }
  };

  const handleSubtopicChange = async (e) => {
    const subtopic = e.target.value;
    setSelectedSubtopic(subtopic);
    
    if (selectedUnit && subtopic) {
      try {
        const params = new URLSearchParams();
        params.append('unit', selectedUnit);
        params.append('subtopic', subtopic);
        
        const response = await axios.get(`/api/professor/questions?${params.toString()}`);
        setAvailableQuestions(response.data.questions || []);
      } catch (error) {
        console.error("Error fetching questions for filter:", error);
      }
    } else {
      setAvailableQuestions([]);
    }
  };

  const toggleQuestionSelection = (questionId) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    setTestResult(null);

    if (!testName || !division) {
      setMessage({ text: 'Please fill in Test Name and Division', type: 'error' });
      setLoading(false);
      return;
    }
    
    if (selectedQuestions.length === 0) {
      setMessage({ text: 'Please select at least one question for the test.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        TestName: testName,
        Division: division,
        QuestionIDs: selectedQuestions,
        Randomized: randomized
      };

      const response = await axios.post('/api/exam/create-test', payload);
      setTestResult(response.data);
      setMessage({ text: 'Test generated successfully!', type: 'success' });
    } catch (error) {
      console.error(error);
      let errorMsg = 'An error occurred while creating the test.';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMsg = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMsg = 'Backend Validation Error: Please deploy your latest backend code. The server expects the old format.';
        }
      }
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const testUrl = testResult ? `${window.location.origin}/test/${testResult.TestID}` : '';

  return (
    <div className="card animate-fade-in">
      <h3 className="mb-3">Create Custom Test</h3>
      
      {!testResult ? (
        <form onSubmit={handleSubmit} className="flex-col gap-4">
          
          {/* Test Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Test Name</label>
              <input type="text" className="form-control" value={testName} onChange={e => setTestName(e.target.value)} placeholder="e.g. Midterm Exam" required />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Division / Class</label>
              <input type="text" className="form-control" value={division} onChange={e => setDivision(e.target.value)} placeholder="e.g. FYMCA Div A" required />
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            <div className="flex justify-between items-center mb-3">
              <h4 className="mb-0">Question Selection</h4>
              <div style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '6px 12px', borderRadius: '9999px', fontSize: '14px', fontWeight: '600' }}>
                {selectedQuestions.length} Selected
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="form-group mb-0">
                <label className="form-label">Filter by Unit</label>
                <select className="form-control" value={selectedUnit} onChange={handleUnitChange}>
                  <option value="">Select Unit</option>
                  {availableUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
              <div className="form-group mb-0">
                <label className="form-label">Filter by Subtopic</label>
                <select className="form-control" value={selectedSubtopic} onChange={handleSubtopicChange} disabled={!selectedUnit}>
                  <option value="">Select Subtopic</option>
                  {(subtopicsCache[selectedUnit] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
            </div>

            {/* Questions List */}
            {selectedSubtopic && (
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface)' }}>
                {availableQuestions.length === 0 ? (
                  <div className="text-center text-muted" style={{ padding: '2rem' }}>No questions found for this subtopic.</div>
                ) : (
                  availableQuestions.map((q, idx) => {
                    const isSelected = selectedQuestions.includes(q._id);
                    return (
                      <div key={q._id} className="flex justify-between" style={{ padding: '1rem', borderBottom: idx !== availableQuestions.length - 1 ? '1px solid var(--border)' : 'none', backgroundColor: isSelected ? '#f0fdf4' : 'var(--surface)', transition: 'var(--transition)' }}>
                        <div style={{ flex: 1, paddingRight: '1rem' }}>
                          <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.75rem', color: 'var(--text-main)' }}>{q.Question}</div>
                          <div className="grid grid-cols-2 gap-2 text-muted" style={{ fontSize: '0.875rem' }}>
                            <div><strong style={{color: 'var(--text-main)'}}>A:</strong> {q.Option_A}</div>
                            <div><strong style={{color: 'var(--text-main)'}}>B:</strong> {q.Option_B}</div>
                            <div><strong style={{color: 'var(--text-main)'}}>C:</strong> {q.Option_C}</div>
                            <div><strong style={{color: 'var(--text-main)'}}>D:</strong> {q.Option_D}</div>
                          </div>
                          <div className="mt-2" style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: '600' }}>
                            Correct Answer: {q.Correct_Answer}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleQuestionSelection(q._id)}
                          className={`btn ${isSelected ? 'btn-danger' : 'btn-primary'}`}
                          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', minWidth: '90px', alignSelf: 'flex-start' }}
                        >
                          {isSelected ? 'Remove' : 'Add'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
            <h4 className="mb-2">Settings</h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input type="radio" name="order" checked={randomized} onChange={() => setRandomized(true)} />
                Randomized Order
              </label>
              <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                <input type="radio" name="order" checked={!randomized} onChange={() => setRandomized(false)} />
                Sequential Order
              </label>
            </div>
          </div>

          {message.text && (
            <div className={`alert mt-2 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary mt-3 w-full" style={{ padding: '1rem', fontSize: '1.1rem' }}>
            {loading ? 'Generating...' : `Generate Test with ${selectedQuestions.length} Questions`}
          </button>
        </form>
      ) : (
        <div className="flex-col items-center gap-4 text-center" style={{ padding: '2rem 1rem' }}>
          <h2 style={{ color: 'var(--success)', margin: 0 }}>Test Generated Successfully!</h2>
          <div style={{ padding: '2rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', width: '100%', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '3rem', margin: '0 0 0.5rem 0', letterSpacing: '0.2em' }}>{testResult.PIN}</h1>
            <p className="text-muted" style={{ margin: 0, fontWeight: '600', textTransform: 'uppercase' }}>Test PIN</p>
          </div>
          <div style={{ padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface)' }}>
            <QRCodeSVG value={testUrl} size={250} level="H" />
            <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.875rem' }}>Scan with mobile device to join</p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full" style={{ maxWidth: '400px' }}>
            <button onClick={() => { navigator.clipboard.writeText(testUrl); alert("URL Copied to clipboard!"); }} className="btn btn-secondary w-full">Copy Link</button>
            <button onClick={() => { setTestResult(null); setTestName(''); setDivision(''); setSelectedQuestions([]); }} className="btn btn-primary w-full">Create Another</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCreator;
