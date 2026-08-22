import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, XCircle, HelpCircle, RefreshCw, Sparkles, BookOpen, Layers } from 'lucide-react';
import { QuizQuestion, QuizResult, Subject, SyllabusUnit } from '../types';
import { api } from '../api/client';

interface QuizViewProps {
  subjects: Subject[];
  selectedSubject: Subject | null;
  setSelectedSubject: (subj: Subject | null) => void;
  units: SyllabusUnit[];
}

export const QuizView: React.FC<QuizViewProps> = ({
  subjects,
  selectedSubject,
  setSelectedSubject,
  units,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<SyllabusUnit | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      setSelectedUnit(units[0]);
    }
  }, [units]);

  const handleGenerateQuiz = async () => {
    if (!selectedSubject || !selectedUnit) return;
    setLoading(true);
    setError(null);
    setQuizResult(null);
    setStudentAnswers({});

    try {
      const qList = await api.generateQuiz(selectedSubject.id, selectedUnit.id, questionCount, difficulty);
      setQuestions(qList);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setStudentAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedUnit || questions.length === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await api.submitQuiz(selectedUnit.id, studentAnswers);
      setQuizResult(res);
    } catch (err: any) {
      setError(err.message || 'Quiz submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
      
      {/* Sidebar: Subject, Unit & Controls */}
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

        {/* Quiz Configuration Panel */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} color="#F59E0B" />
            Quiz Parameters
          </h3>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#D1D5DB', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Syllabus Unit
            </label>
            <select
              value={selectedUnit?.id || ''}
              onChange={(e) => {
                const u = units.find((un) => un.id === e.target.value) || null;
                setSelectedUnit(u);
              }}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
            >
              {units.map((u) => (
                <option key={u.id} value={u.id} style={{ background: '#111827' }}>
                  Unit {u.order_index}: {u.unit_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#D1D5DB', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Difficulty Tier
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: difficulty === d ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.05)',
                    background: difficulty === d ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0,0,0,0.3)',
                    color: difficulty === d ? '#FBBF24' : '#9CA3AF',
                    fontSize: '0.75rem',
                    textTransform: 'capitalize',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#D1D5DB', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Question Count ({questionCount})
            </label>
            <input
              type="range"
              min={3}
              max={15}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#F59E0B' }}
            />
          </div>

          <button
            onClick={handleGenerateQuiz}
            className="btn-primary"
            disabled={!selectedUnit || loading}
            style={{ justifyContent: 'center', marginTop: '8px', background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
          >
            <Sparkles size={16} />
            {loading ? 'Generating...' : 'Start New Quiz'}
          </button>
        </div>

      </div>

      {/* Main Area: Questions or Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {error && (
          <div style={{ color: '#F87171', background: 'rgba(239,68,68,0.1)', padding: '14px', borderRadius: '10px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Results Overview Box (If Submitted) */}
        {quizResult && (
          <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 className="gradient-text" style={{ fontSize: '1.4rem', fontWeight: 800 }}>Quiz Completed!</h3>
                <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Performance summary for {selectedUnit?.unit_name}</p>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: quizResult.percentage >= 70 ? '#34D399' : '#FBBF24' }}>
                  {quizResult.percentage}%
                </span>
                <p style={{ fontSize: '0.8rem', color: '#D1D5DB' }}>
                  Score: {quizResult.score} / {quizResult.total}
                </p>
              </div>
            </div>

            {/* Breakdown List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              {quizResult.breakdown.map((item, idx) => (
                <div key={idx} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', borderLeft: item.is_correct ? '4px solid #10B981' : '4px solid #F43F5E' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {item.is_correct ? <CheckCircle2 size={16} color="#10B981" /> : <XCircle size={16} color="#F43F5E" />}
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F3F4F6' }}>
                      Q{idx + 1}: {item.question_text}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', marginTop: '4px', marginLeft: '24px' }}>
                    <span style={{ color: item.is_correct ? '#34D399' : '#F87171' }}>
                      Your Answer: <strong>{item.student_answer || 'Unanswered'}</strong>
                    </span>
                    {!item.is_correct && (
                      <span style={{ color: '#34D399' }}>
                        Correct Answer: <strong>{item.correct_answer}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="glass-panel" style={{ padding: '28px', flex: 1 }}>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Sparkles size={40} color="#F59E0B" className="animate-spin" style={{ margin: '0 auto 16px auto' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600 }} className="gradient-text">Generating Vetted Quiz Questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280' }}>
              <Award size={48} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>Click "Start New Quiz" to generate questions</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F3F4F6' }}>
                  {selectedUnit?.unit_name} Quiz ({questions.length} Questions)
                </h3>
                <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
                  Difficulty: {difficulty}
                </span>
              </div>

              {questions.map((q, qIdx) => {
                const selectedOpt = studentAnswers[q.id] || '';
                return (
                  <div key={q.id} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', padding: '20px', borderRadius: '14px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#C084FC', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        Q{qIdx + 1} ({q.type.replace('_', ' ').toUpperCase()})
                      </span>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#F3F4F6' }}>{q.question_text}</p>
                    </div>

                    {/* Question Options */}
                    {q.options && q.options.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === opt;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => handleSelectOption(q.id, opt)}
                              disabled={!!quizResult}
                              style={{
                                textAlign: 'left',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: isSelected ? '1.5px solid #8B5CF6' : '1px solid rgba(255,255,255,0.06)',
                                background: isSelected ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255,255,255,0.02)',
                                color: isSelected ? '#F3F4F6' : '#D1D5DB',
                                fontSize: '0.85rem',
                                cursor: quizResult ? 'default' : 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <span style={{ fontWeight: 700, marginRight: '8px', opacity: 0.7 }}>
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Fill in the blank input */
                      <input
                        type="text"
                        placeholder="Type your answer here..."
                        value={selectedOpt}
                        onChange={(e) => handleSelectOption(q.id, e.target.value)}
                        disabled={!!quizResult}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '10px', color: 'white', marginTop: '8px' }}
                      />
                    )}

                  </div>
                );
              })}

              {!quizResult && (
                <button
                  onClick={handleSubmitQuiz}
                  className="btn-primary"
                  disabled={submitting || Object.keys(studentAnswers).length === 0}
                  style={{ alignSelf: 'flex-end', marginTop: '12px', background: 'linear-gradient(135deg, #10B981, #059669)' }}
                >
                  <CheckCircle2 size={18} />
                  {submitting ? 'Evaluating Score...' : 'Submit Quiz for Grading'}
                </button>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
