import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmModal from './ConfirmModal';

const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [subtopicsCache, setSubtopicsCache] = useState({});
  
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    confirmColor: 'primary'
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
      confirmColor
    });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

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

  const handleDelete = (id) => {
    openConfirm(
      "Delete Question",
      "Are you sure you want to delete this question?",
      async () => {
        try {
          await axios.delete(`/api/professor/questions/${id}`);
          setQuestions(prev => prev.filter(q => q._id !== id));
        } catch (error) {
          console.error("Error deleting question:", error);
          alert("Failed to delete question.");
        }
      },
      "Delete",
      "danger"
    );
  };

  return (
    <div className="card animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="mb-0">Question Bank Viewer</h3>
        <span style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: '600' }}>
          {questions.length} Questions
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4" style={{ backgroundColor: '#f1f5f9', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div className="form-group mb-0">
          <label className="form-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Unit</label>
          <select className="form-control" value={selectedUnit} onChange={handleUnitChange}>
            <option value="">All Units</option>
            {availableUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>
        
        <div className="form-group mb-0">
          <label className="form-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter by Subtopic</label>
          <select className="form-control" value={selectedSubtopic} onChange={e => setSelectedSubtopic(e.target.value)} disabled={!selectedUnit}>
            <option value="">All Subtopics</option>
            {(subtopicsCache[selectedUnit] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted" style={{ padding: '3rem' }}>Loading questions...</div>
      ) : questions.length === 0 ? (
        <div className="text-center text-muted" style={{ padding: '3rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
          No questions found for the selected filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxHeight: '600px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead style={{ backgroundColor: '#f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Question Details</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', width: '300px' }}>Options</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', width: '150px' }}>Correct Answer</th>
                <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)', width: '100px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => (
                <tr key={q._id || idx} style={{ borderBottom: '1px solid var(--border)', backgroundColor: idx % 2 === 0 ? 'var(--surface)' : '#f8fafc', transition: 'var(--transition)' }}>
                  <td style={{ padding: '1.5rem', verticalAlign: 'top' }}>
                    <div style={{ display: 'inline-block', padding: '2px 8px', backgroundColor: '#e2e8f0', color: 'var(--text-muted)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      {q.Unit} &bull; {q.Subtopic}
                    </div>
                    <div style={{ lineHeight: '1.5', fontWeight: '500', color: 'var(--text-main)' }}>{q.Question}</div>
                  </td>
                  <td style={{ padding: '1.5rem', verticalAlign: 'top' }}>
                    <div className="flex-col gap-2 text-muted">
                      <div className="flex gap-2"><span style={{ fontWeight: '600', width: '20px' }}>A</span> <span>{q.Option_A}</span></div>
                      <div className="flex gap-2"><span style={{ fontWeight: '600', width: '20px' }}>B</span> <span>{q.Option_B}</span></div>
                      <div className="flex gap-2"><span style={{ fontWeight: '600', width: '20px' }}>C</span> <span>{q.Option_C}</span></div>
                      <div className="flex gap-2"><span style={{ fontWeight: '600', width: '20px' }}>D</span> <span>{q.Option_D}</span></div>
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem', verticalAlign: 'top' }}>
                    <span style={{ display: 'inline-block', padding: '6px 12px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.875rem' }}>
                      {q.Correct_Answer}
                    </span>
                  </td>
                  <td style={{ padding: '1.5rem', verticalAlign: 'top', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDelete(q._id)}
                      className="btn"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', backgroundColor: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }}
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

export default QuestionBank;
