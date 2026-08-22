import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Sparkles, User, Bot, HelpCircle, BookOpen, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { marked } from 'marked';
import { Subject, TutorMode, TutorSession } from '../types';
import { api } from '../api/client';

interface TutorChatProps {
  subjects: Subject[];
  selectedSubject: Subject | null;
  setSelectedSubject: (subj: Subject | null) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: Date;
}

export const TutorChat: React.FC<TutorChatProps> = ({
  subjects,
  selectedSubject,
  setSelectedSubject,
}) => {
  const [activeMode, setActiveMode] = useState<TutorMode>('standard');
  const [session, setSession] = useState<TutorSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const modes: { id: TutorMode; label: string; desc: string; color: string }[] = [
    { id: 'beginner', label: 'Beginner Mode', desc: 'Simple terms, analogies, encouraging', color: '#10B981' },
    { id: 'standard', label: 'Standard Academic', desc: 'Clear, balanced, complete depth', color: '#06B6D4' },
    { id: 'interview', label: 'Exam / Interview', desc: 'Concise, direct, challenging questions', color: '#F43F5E' },
  ];

  const initSession = async (subj: Subject, mode: TutorMode) => {
    try {
      const sess = await api.createTutorSession(subj.id, mode);
      setSession(sess);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I am your AI Tutor for **${subj.name}**. I am currently operating in **${mode.toUpperCase()}** mode. Ask me any question from your syllabus!`,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      console.error('Failed to create tutor session:', err);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      initSession(selectedSubject, activeMode);
    }
  }, [selectedSubject, activeMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !session || loading) return;

    const userText = inputMsg.trim();
    setInputMsg('');

    const userMsgObj: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsgObj]);
    setLoading(true);

    try {
      const res = await api.sendTutorMessage(session.id, userText);
      const assistantMsgObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply,
        sources: res.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsgObj]);
    } catch (err: any) {
      const errorMsgObj: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Error retrieving answer: ${err.message || 'Tutor service error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsgObj]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', height: 'calc(100vh - 140px)' }}>
      
      {/* Sidebar: Subject & Tutor Mode Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Subject Selector */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9CA3AF', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
            Active Subject
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

        {/* Persona Mode Card Selector */}
        <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#8B5CF6" />
            Tutor Persona Mode
          </h3>

          {modes.map((m) => {
            const isActive = activeMode === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setActiveMode(m.id)}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: isActive ? `1.5px solid ${m.color}` : '1px solid rgba(255,255,255,0.05)',
                  background: isActive ? `${m.color}15` : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isActive ? '#F3F4F6' : '#D1D5DB' }}>{m.label}</span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? m.color : '#4B5563' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{m.desc}</p>
              </div>
            );
          })}
        </div>

      </div>

      {/* Main Chat Interface */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        {/* Chat Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#F3F4F6' }}>
                AI Tutor — {selectedSubject ? selectedSubject.name : 'Select Subject'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 600 }}>
                RAG Active • Mode: {activeMode.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Messages Stream Area */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const hasSources = msg.sources && msg.sources.length > 0;
            const isExpanded = expandedSources[msg.id];

            return (
              <div key={msg.id} style={{ display: 'flex', gap: '12px', flexDirection: isUser ? 'row-reverse' : 'row', maxWidth: '85%', alignSelf: isUser ? 'flex-end' : 'flex-start' }}>
                
                {/* Avatar */}
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isUser ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)' : 'linear-gradient(135deg, #8B5CF6, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isUser ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
                </div>

                {/* Message Bubble */}
                <div style={{
                  background: isUser ? 'rgba(59, 130, 246, 0.2)' : 'rgba(31, 41, 55, 0.7)',
                  border: isUser ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '14px 18px',
                  color: '#F3F4F6',
                  fontSize: '0.9rem',
                }}>
                  
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                  />

                  {/* RAG Source Citations Collapsible */}
                  {hasSources && (
                    <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        onClick={() => toggleSources(msg.id)}
                        style={{ background: 'transparent', border: 'none', color: '#A78BFA', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      >
                        <BookOpen size={12} />
                        {msg.sources!.length} RAG Syllabus Sources Used
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {isExpanded && (
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {msg.sources!.map((src, idx) => (
                            <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 10px', borderRadius: '6px', fontSize: '0.75rem', color: '#D1D5DB', borderLeft: '2px solid #8B5CF6' }}>
                              {src}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>
            );
          })}

          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="white" className="animate-spin" />
              </div>
              <div style={{ background: 'rgba(31, 41, 55, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '12px 18px', color: '#9CA3AF', fontSize: '0.85rem' }}>
                AI Tutor is reasoning & querying syllabus vectors...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder={selectedSubject ? `Ask AI Tutor about ${selectedSubject.name}...` : 'Select a subject to start chatting...'}
            disabled={!selectedSubject || loading}
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '0.9rem' }}
          />
          <button type="submit" className="btn-primary" disabled={!selectedSubject || loading || !inputMsg.trim()} style={{ borderRadius: '12px' }}>
            <Send size={16} />
            Send
          </button>
        </form>

      </div>

    </div>
  );
};
