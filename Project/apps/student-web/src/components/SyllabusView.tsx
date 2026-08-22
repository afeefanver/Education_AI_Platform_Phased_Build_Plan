import React, { useState, useEffect } from 'react';
import { Upload, Plus, BookOpen, Layers, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { Subject, SyllabusUnit } from '../types';
import { api } from '../api/client';

interface SyllabusViewProps {
  subjects: Subject[];
  selectedSubject: Subject | null;
  setSelectedSubject: (subj: Subject | null) => void;
  units: SyllabusUnit[];
  onUnitsUpdated: () => void;
}

export const SyllabusView: React.FC<SyllabusViewProps> = ({
  subjects,
  selectedSubject,
  setSelectedSubject,
  units,
  onUnitsUpdated,
}) => {
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjClass, setNewSubjClass] = useState('Grade 10');
  const [file, setFile] = useState<File | null>(null);
  const [unitsText, setUnitsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    try {
      const subj = await api.createSubject(newSubjName, newSubjClass);
      setNewSubjName('');
      setSelectedSubject(subj);
      onUnitsUpdated();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      setStatusMsg({ type: 'error', text: 'Please select or create a subject first' });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.uploadSyllabus(selectedSubject.id, file, unitsText);
      setStatusMsg({ type: 'success', text: `Extracted ${res.units.length} syllabus units & indexed vectors successfully!` });
      setFile(null);
      setUnitsText('');
      onUnitsUpdated();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
      
      {/* Sidebar: Subject Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Create Subject Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="#8B5CF6" />
            Add New Subject
          </h3>
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Subject Name (e.g. Physics)"
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.85rem' }}
            />
            <input
              type="text"
              placeholder="Class Level (e.g. Grade 10)"
              value={newSubjClass}
              onChange={(e) => setNewSubjClass(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn-secondary" style={{ justifyContent: 'center', fontSize: '0.85rem' }}>
              Create Subject
            </button>
          </form>
        </div>

        {/* Subjects List */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={18} color="#06B6D4" />
            Your Subjects ({subjects.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {subjects.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#6B7280', fontStyle: 'italic' }}>No subjects added yet.</p>
            ) : (
              subjects.map((s) => {
                const isSelected = selectedSubject?.id === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSubject(s)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.15))' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#F3F4F6' : '#D1D5DB' }}>{s.name}</p>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{s.class_level}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Main Area: Syllabus Upload & Extracted Units */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {!selectedSubject ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <BookOpen size={48} color="#8B5CF6" style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Select or Add a Subject</h3>
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '4px' }}>
              Choose a subject from the left panel to upload syllabus PDFs or view extracted chapters.
            </p>
          </div>
        ) : (
          <>
            {/* Upload Box */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }} className="gradient-text">
                    Ingest Syllabus for {selectedSubject.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>Upload syllabus PDF or paste chapter names for AI RAG indexing.</p>
                </div>
                <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38BDF8', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                  RAG Vector Store Active
                </span>
              </div>

              {statusMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: statusMsg.type === 'success' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  color: statusMsg.type === 'success' ? '#34D399' : '#F87171',
                }}>
                  {statusMsg.text}
                </div>
              )}

              <form onSubmit={handleUploadSyllabus} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Drag-and-Drop PDF Box */}
                <div style={{ border: '2px dashed var(--border-glass)', borderRadius: '12px', padding: '24px', textAlign: 'center', background: 'rgba(0,0,0,0.2)', position: 'relative' }}>
                  <Upload size={32} color="#8B5CF6" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#E5E7EB' }}>
                    {file ? file.name : 'Click to select or drag Syllabus PDF here'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>PDF documents up to 25MB</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                  />
                </div>

                <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '0.8rem', fontWeight: 600 }}>— OR PASTE TEXT —</div>

                <textarea
                  rows={3}
                  placeholder="Paste syllabus units / chapters (comma or line separated e.g. Unit 1: Thermodynamics, Unit 2: Electrostatics)..."
                  value={unitsText}
                  onChange={(e) => setUnitsText(e.target.value)}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '12px', color: 'white', fontSize: '0.85rem', resize: 'vertical' }}
                />

                <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                  <Sparkles size={16} />
                  {loading ? 'Ingesting & Indexing...' : 'Extract & Index Syllabus'}
                </button>
              </form>
            </div>

            {/* Units Extracted List */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="#10B981" />
                Extracted Syllabus Units ({units.length})
              </h3>

              {units.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#6B7280' }}>
                  <FileText size={36} style={{ opacity: 0.5, margin: '0 auto 8px auto' }} />
                  <p style={{ fontSize: '0.9rem' }}>No units extracted for this subject yet.</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>Upload a PDF or enter text above to extract units.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {units.map((u) => (
                    <div key={u.id} className="glass-panel glass-panel-hover" style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                          {u.order_index}
                        </span>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#F3F4F6' }}>{u.unit_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>

    </div>
  );
};
