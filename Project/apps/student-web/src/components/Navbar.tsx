import React from 'react';
import { BookOpen, FileText, MessageSquare, Award, Coins, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { MeData } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  me: MeData | null;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, me, onLogout, onOpenAuth }) => {
  const tabs = [
    { id: 'syllabus', label: 'Syllabus Intelligence', icon: BookOpen },
    { id: 'notes', label: 'AI Study Notes', icon: FileText },
    { id: 'tutor', label: 'AI RAG Tutor', icon: MessageSquare },
    { id: 'quiz', label: 'Interactive Quizzes', icon: Award },
  ];

  return (
    <header className="glass-panel" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('syllabus')}>
          <div style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', padding: '10px', borderRadius: '12px', display: 'flex', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)' }}>
            <Sparkles size={22} color="white" />
          </div>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>EduAI Platform</h1>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Student Learning Hub</p>
          </div>
        </div>

        {/* Nav Tabs */}
        <nav style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(6, 182, 212, 0.2))' : 'transparent',
                  color: isActive ? '#F3F4F6' : '#9CA3AF',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderBottom: isActive ? '2px solid #8B5CF6' : '2px solid transparent',
                }}
              >
                <Icon size={16} color={isActive ? '#8B5CF6' : '#9CA3AF'} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User / Credits Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {me ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 12px', borderRadius: '20px' }}>
                <Coins size={16} color="#F59E0B" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FBBF24' }}>{me.organization.credits_balance}</span>
                <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Credits</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F3F4F6' }}>{me.user.full_name}</p>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    {me.user.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <button className="btn-primary" onClick={onOpenAuth}>
              <UserIcon size={16} />
              Sign In
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
