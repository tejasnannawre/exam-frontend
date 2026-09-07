import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const TestCreator = () => {
  const [testName, setTestName] = useState('');
  const [division, setDivision] = useState('');
  const [randomized, setRandomized] = useState(true);
  const [topics, setTopics] = useState([{ Unit: '', Subtopic: '', QuestionCount: 1 }]);
  
  const [availableUnits, setAvailableUnits] = useState([]);
  const [subtopicsCache, setSubtopicsCache] = useState({}); // { "Unit1": ["Sub1", "Sub2"] }
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [testResult, setTestResult] = useState(null); // { TestID, PIN }

  useEffect(() => {
    // Fetch available units
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
      setSubtopicsCache(prev => ({
        ...prev,
        [unit]: response.data.subtopics || []
      }));
    } catch (error) {
      console.error(`Error fetching subtopics for ${unit}:`, error);
    }
  };

  const handleTopicChange = async (index, field, value) => {
    const newTopics = [...topics];
    newTopics[index][field] = value;
    
    // Reset subtopic if unit changes and fetch new subtopics
    if (field === 'Unit') {
      newTopics[index]['Subtopic'] = '';
      if (value) {
        fetchSubtopicsForUnit(value);
      }
    }
    
    setTopics(newTopics);
  };

  const addTopic = () => {
    setTopics([...topics, { Unit: '', Subtopic: '', QuestionCount: 1 }]);
  };

  const removeTopic = (index) => {
    const newTopics = topics.filter((_, i) => i !== index);
    setTopics(newTopics);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    setTestResult(null);

    // Basic validation
    if (!testName || !division) {
      setMessage({ text: 'Please fill in Test Name and Division', type: 'error' });
      setLoading(false);
      return;
    }
    
    for (const t of topics) {
      if (!t.Unit || !t.Subtopic || t.QuestionCount <= 0) {
        setMessage({ text: 'Please fill out all topic selections correctly.', type: 'error' });
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        TestName: testName,
        Division: division,
        Topics: topics,
        Randomized: randomized
      };

      const response = await axios.post('/api/exam/create-test', payload);
      setTestResult(response.data);
      setMessage({ text: 'Test generated successfully!', type: 'success' });
    } catch (error) {
      console.error(error);
      setMessage({ 
        text: error.response?.data?.detail || 'An error occurred while creating the test.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // The student test URL would be the current domain + /test/TestID
  const testUrl = testResult ? `${window.location.origin}/test/${testResult.TestID}` : '';

  return (
    <div style={{ marginTop: '30px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <h3 style={{ marginTop: 0, color: '#4b5563', marginBottom: '20px' }}>Create New Test</h3>
      
      {!testResult ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#374151' }}>Test Name</label>
              <input 
                type="text" 
                value={testName}
                onChange={e => setTestName(e.target.value)}
                placeholder="e.g. Midterm Exam"
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#1f2937', outline: 'none' }}
                required
              />
            </div>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#374151' }}>Division / Class</label>
              <input 
                type="text" 
                value={division}
                onChange={e => setDivision(e.target.value)}
                placeholder="e.g. FYMCA Div A"
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#1f2937', outline: 'none' }}
                required
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4b5563' }}>Question Selection</h4>
            
            {topics.map((topic, index) => (
              <div key={index} style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end', marginBottom: '15px', backgroundColor: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', color: '#6b7280' }}>Unit</label>
                  <select 
                    value={topic.Unit} 
                    onChange={e => handleTopicChange(index, 'Unit', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#1f2937', outline: 'none' }}
                    required
                  >
                    <option value="">Select Unit</option>
                    {availableUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', color: '#6b7280' }}>Subtopic</label>
                  <select 
                    value={topic.Subtopic} 
                    onChange={e => handleTopicChange(index, 'Subtopic', e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#1f2937', outline: 'none' }}
                    disabled={!topic.Unit}
                    required
                  >
                    <option value="">Select Subtopic</option>
                    {(subtopicsCache[topic.Unit] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ flex: '1 1 80px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '13px', color: '#6b7280' }}>No. of Qs</label>
                  <input 
                    type="number" 
                    min="1"
                    value={topic.QuestionCount}
                    onChange={e => handleTopicChange(index, 'QuestionCount', parseInt(e.target.value) || 0)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#1f2937', outline: 'none' }}
                    required
                  />
                </div>
                
                {topics.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeTopic(index)}
                    style={{ padding: '8px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    X
                  </button>
                )}
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={addTopic}
              style={{ padding: '8px 15px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            >
              + Add Another Topic
            </button>
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: '0', color: '#4b5563' }}>Settings</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="order" 
                  checked={randomized} 
                  onChange={() => setRandomized(true)} 
                />
                Randomized Order
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="order" 
                  checked={!randomized} 
                  onChange={() => setRandomized(false)} 
                />
                Sequential Order
              </label>
            </div>
          </div>

          {message.text && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '6px',
              backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: message.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`
            }}>
              {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '15px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontSize: '16px', 
              fontWeight: 'bold',
              marginTop: '10px'
            }}
          >
            {loading ? 'Generating...' : 'Generate Test & QR Code'}
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '30px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <h2 style={{ color: '#10b981', margin: 0 }}>Test Generated Successfully!</h2>
          
          <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
            <h1 style={{ fontSize: '48px', margin: '0 0 10px 0', color: '#1f2937', letterSpacing: '5px' }}>{testResult.PIN}</h1>
            <p style={{ color: '#6b7280', margin: 0, fontWeight: 'bold', textTransform: 'uppercase' }}>Test PIN</p>
          </div>
          
          <div style={{ padding: '20px', border: '2px dashed #d1d5db', borderRadius: '8px', backgroundColor: 'white' }}>
            <QRCodeSVG value={testUrl} size={250} level="H" />
            <p style={{ marginTop: '15px', color: '#4b5563', fontSize: '14px' }}>Scan with mobile device to join</p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '400px' }}>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(testUrl);
                alert("URL Copied to clipboard!");
              }}
              style={{ flex: 1, padding: '10px', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Copy Link
            </button>
            <button 
              onClick={() => {
                setTestResult(null);
                setTestName('');
                setDivision('');
              }}
              style={{ flex: 1, padding: '10px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCreator;
