import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { SyllabusView } from './components/SyllabusView';
import { NotesView } from './components/NotesView';
import { TutorChat } from './components/TutorChat';
import { QuizView } from './components/QuizView';
import { MeData, Subject, SyllabusUnit } from './types';
import { api } from './api/client';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('syllabus');
  const [me, setMe] = useState<MeData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<SyllabusUnit[]>([]);

  const fetchUserData = async () => {
    try {
      const data = await api.getMe();
      setMe(data);
      setShowAuthModal(false);
      fetchSubjects();
    } catch {
      // If unauthorized, open auth modal
      setShowAuthModal(true);
    }
  };

  const fetchSubjects = async () => {
    try {
      const list = await api.getSubjects();
      setSubjects(list);
      if (list.length > 0 && !selectedSubject) {
        setSelectedSubject(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const fetchUnits = async (subjectId: string) => {
    try {
      const uList = await api.getUnits(subjectId);
      setUnits(uList);
    } catch (err) {
      console.error('Failed to fetch units:', err);
    }
  };

  useEffect(() => {
    if (api.getToken()) {
      fetchUserData();
    } else {
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      fetchUnits(selectedSubject.id);
    } else {
      setUnits([]);
    }
  }, [selectedSubject]);

  const handleLogout = () => {
    api.setToken(null);
    setMe(null);
    setShowAuthModal(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        me={me}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        
        {activeTab === 'syllabus' && (
          <SyllabusView
            subjects={subjects}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            units={units}
            onUnitsUpdated={() => {
              fetchSubjects();
              if (selectedSubject) fetchUnits(selectedSubject.id);
            }}
          />
        )}

        {activeTab === 'notes' && (
          <NotesView
            subjects={subjects}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            units={units}
          />
        )}

        {activeTab === 'tutor' && (
          <TutorChat
            subjects={subjects}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            subjects={subjects}
            selectedSubject={selectedSubject}
            setSelectedSubject={setSelectedSubject}
            units={units}
          />
        )}

      </main>

      {/* Auth Modal overlay */}
      {showAuthModal && (
        <AuthModal
          onSuccess={() => {
            fetchUserData();
          }}
        />
      )}

    </div>
  );
};

export default App;
