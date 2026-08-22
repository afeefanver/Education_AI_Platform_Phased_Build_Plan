import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, BookOpen, Clock, Zap, Target, Table, Check } from 'lucide-react';
import { marked } from 'marked';
import { Note, NoteType, Subject, SyllabusUnit } from '../types';
import { api } from '../api/client';

interface NotesViewProps {
  subjects: Subject[];
  selectedSubject: Subject | null;
  setSelectedSubject: (subj: Subject | null) => void;
  units: SyllabusUnit[];
}

export const NotesView: React.FC<NotesViewProps> = ({
  subjects,
  selectedSubject,
  setSelectedSubject,
  units,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<SyllabusUnit | null>(null);
  const [activeType, setActiveType] = useState<NoteType>('detailed');
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noteTypes: { id: NoteType; label: string; icon: any; color: string; desc: string }[] = [
    { id: 'detailed', label: 'Detailed Study', icon: FileText, color: '#8B5CF6', desc: 'Comprehensive theory & formulas' },
    { id: 'exam', label: 'Exam Prep', icon: Target, color: '#F43F5E', desc: 'High-yield exam questions' },
    { id: 'revision', label: 'Quick Revision', icon: Zap, color: '#06B6D4', desc: 'Core bullet point summary' },
    { id: 'last_minute', label: 'Last Minute', icon: Clock, color: '#F59E0B', desc: 'Flashcard facts before exam' },
    { id: 'cheat_sheet', label: 'Cheat Sheet', icon: Table, color: '#10B981', desc: 'Key formulas & term table' },
  ];

  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      setSelectedUnit(units[0]);
    }
  }, [units]);

  const loadOrGenerateNote = async (unit: SyllabusUnit, type: NoteType) => {
    if (!selectedSubject) return;
    setLoading(true);
    setError(null);
    try {
      // First check existing notes
      const existing = await api.getNotesByUnit(unit.id);
      const match = existing.find((n) => n.type === type);
      if (match) {
        setCurrentNote(match);
      } else {
        // Generate new note
        const note = await api.generateNotes(selectedSubject.id, unit.id, type);
        setCurrentNote(note);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate note');
    } finally {
      setLoading(false);
    }
  };

  const handleUnitChange = (u: SyllabusUnit) => {
    setSelectedUnit(u);
    loadOrGenerateNote(u, activeType);
  };

  const handleTypeChange = (type: NoteType) => {
    setActiveType(type);
    if (selectedUnit) {
      loadOrGenerateNote(selectedUnit, type);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
      
      {/* Sidebar: Subject & Unit Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Subject Selector */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
            Select Subject
          </label>
          <select
            value={selectedSubject?.id || ''}
            onChange={(e) => {
              const s = subjects.find((sub) => sub.id === e.target.value) || null;
              setSelectedSubject(s);
            }}
            style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.9rem' }}
          >
            <option value="" disabled>Choose Subject...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id} style={{ background: '#111827' }}>
                {s.name} ({s.class_level})
              </option>
            ))}
          </select>
        </div>

        {/* Units List */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} color="#8B5CF6" />
            Syllabus Units ({units.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '420px', overflowY: 'auto' }}>
            {units.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#6B7280', fontStyle: 'italic' }}>Upload syllabus first to see units.</p>
            ) : (
              units.map((u) => {
                const isSelected = selectedUnit?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleUnitChange(u)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid #8B5CF6' : '1px solid rgba(255,255,255,0.03)',
                      background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      color: isSelected ? '#F3F4F6' : '#9CA3AF',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{u.order_index}.</span>
                    <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.unit_name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Main Area: Note Type Selector & Note Content Viewer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Note Type Format Selector Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {noteTypes.map((t) => {
            const Icon = t.icon;
            const isActive = activeType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTypeChange(t.id)}
                className="glass-panel"
                style={{
                  padding: '14px 10px',
                  borderRadius: '12px',
                  border: isActive ? `1.5px solid ${t.color}` : '1px solid var(--border-glass)',
                  background: isActive ? `${t.color}22` : 'rgba(17, 24, 39, 0.6)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={20} color={t.color} style={{ margin: '0 auto 6px auto' }} />
                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? '#F3F4F6' : '#D1D5DB' }}>{t.label}</p>
                <span style={{ fontSize: '0.68rem', color: '#9CA3AF', display: 'block', marginTop: '2px' }}>{t.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Note Viewer Card */}
        <div className="glass-panel" style={{ padding: '28px', minHeight: '480px' }}>
          
          {!selectedUnit ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
              <FileText size={48} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>Select a Syllabus Unit to View Notes</p>
            </div>
          ) : loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <Sparkles size={40} color="#8B5CF6" className="animate-spin" style={{ margin: '0 auto 16px auto' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600 }} className="gradient-text">Generating AI Study Notes...</p>
              <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '4px' }}>Retrieving vector context for {selectedUnit.unit_name}</p>
            </div>
          ) : error ? (
            <div style={{ color: '#F87171', background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: '10px', fontSize: '0.9rem' }}>
              {error}
            </div>
          ) : currentNote ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F3F4F6' }}>
                    {selectedUnit.unit_name}
                  </h2>
                  <span style={{ fontSize: '0.75rem', color: '#A78BFA', fontWeight: 600, textTransform: 'uppercase' }}>
                    Format: {currentNote.type.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '4px 10px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 600 }}>
                  <Check size={14} /> Cached & RAG Indexed
                </div>
              </div>

              {/* Rendered Markdown Body */}
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: marked.parse(currentNote.content) as string }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
              <p style={{ fontSize: '0.9rem' }}>Click a unit above to generate notes.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
