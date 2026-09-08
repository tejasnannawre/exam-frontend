import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [subtopicsCache, setSubtopicsCache] = useState({});
  
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');

  // Fetch initial units
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
    if (unit) {
      fetchSubtopicsForUnit(unit);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedUnit) params.append('unit', selectedUnit);
      if (selectedSubtopic) params.append('subtopic', selectedSubtopic);
      
      const response = await axios.get(`/api/professor/questions?${params.toString()}`);
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedUnit, selectedSubtopic]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        await axios.delete(`/api/professor/questions/${id}`);
        setQuestions(prev => prev.filter(q => q._id !== id));
      } catch (error) {
        console.error("Error deleting question:", error);
        alert("Failed to delete question.");
      }
    }
  };

  return (
    <div style={{ marginTop: '30px', backgroundColor: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h3 style={{ margin: 0, color: '#111827', fontSize: '1.25rem', fontWeight: '600' }}>Question Bank Viewer</h3>
        <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '500' }}>
          {questions.length} Questions
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Unit</label>
          <select 
            value={selectedUnit} 
            onChange={handleUnitChange}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#1f2937', fontSize: '14px', outline: 'none', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            <option value="" style={{ color: '#1f2937' }}>All Units</option>
            {availableUnits.map(unit => (
              <option key={unit} value={unit} style={{ color: '#1f2937' }}>{unit}</option>
            ))}
          </select>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Subtopic</label>
          <select 
            value={selectedSubtopic} 
            onChange={e => setSelectedSubtopic(e.target.value)}
            disabled={!selectedUnit}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: !selectedUnit ? '#f3f4f6' : 'white', color: '#1f2937', fontSize: '14px', outline: 'none', cursor: !selectedUnit ? 'not-allowed' : 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            <option value="" style={{ color: '#1f2937' }}>All Subtopics</option>
            {(subtopicsCache[selectedUnit] || []).map(sub => (
              <option key={sub} value={sub} style={{ color: '#1f2937' }}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>Loading questions...</div>
      ) : questions.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db', color: '#6b7280' }}>
          No questions found for the selected filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: '600px', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', fontSize: '14px', minWidth: '900px' }}>
            <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <tr>
                <th style={{ padding: '16px 20px', textAlign: 'left', color: '#374151', fontWeight: '600', letterSpacing: '0.025em' }}>Question Details</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', color: '#374151', fontWeight: '600', letterSpacing: '0.025em', width: '300px' }}>Options</th>
                <th style={{ padding: '16px 20px', textAlign: 'left', color: '#374151', fontWeight: '600', letterSpacing: '0.025em', width: '150px' }}>Correct Answer</th>
                <th style={{ padding: '16px 20px', textAlign: 'center', color: '#374151', fontWeight: '600', letterSpacing: '0.025em', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'white' }}>
              {questions.map((q, idx) => (
                <tr key={q._id || idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb', transition: 'background-color 0.15s ease' }}>
                  <td style={{ padding: '20px', verticalAlign: 'top', color: '#1f2937' }}>
                    <div style={{ display: 'inline-block', padding: '2px 8px', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '4px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '10px' }}>
                      {q.Unit} &bull; {q.Subtopic}
                    </div>
                    <div style={{ lineHeight: '1.5', fontWeight: '500' }}>{q.Question}</div>
                  </td>
                  <td style={{ padding: '20px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', color: '#4b5563' }}>
                      <div style={{ display: 'flex', gap: '10px' }}><span style={{ fontWeight: '600', color: '#6b7280', width: '15px' }}>A</span> <span>{q.Option_A}</span></div>
                      <div style={{ display: 'flex', gap: '10px' }}><span style={{ fontWeight: '600', color: '#6b7280', width: '15px' }}>B</span> <span>{q.Option_B}</span></div>
                      <div style={{ display: 'flex', gap: '10px' }}><span style={{ fontWeight: '600', color: '#6b7280', width: '15px' }}>C</span> <span>{q.Option_C}</span></div>
                      <div style={{ display: 'flex', gap: '10px' }}><span style={{ fontWeight: '600', color: '#6b7280', width: '15px' }}>D</span> <span>{q.Option_D}</span></div>
                    </div>
                  </td>
                  <td style={{ padding: '20px', verticalAlign: 'top' }}>
                    <span style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}>
                      {q.Correct_Answer}
                    </span>
                  </td>
                  <td style={{ padding: '20px', verticalAlign: 'top', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(q._id)}
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
    </div>
  );
};

export default QuestionBank;
