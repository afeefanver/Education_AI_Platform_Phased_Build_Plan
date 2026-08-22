import { MeData, Note, NoteType, QuizQuestion, QuizResult, Subject, SyllabusUnit, TutorMode, TutorResponse, TutorSession } from '../types';

const API_BASE = 'http://localhost:8000';

class ApiClient {
  private token: string | null = localStorage.getItem('access_token');

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errData.detail || 'API request failed');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    const res = await this.request<{ access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.access_token);
    return res;
  }

  async getMe(): Promise<MeData> {
    return this.request<MeData>('/me');
  }

  // Syllabus & Subjects
  async getSubjects(): Promise<Subject[]> {
    return this.request<Subject[]>('/syllabus/subjects');
  }

  async createSubject(name: string, class_level: string): Promise<Subject> {
    return this.request<Subject>('/syllabus/subjects', {
      method: 'POST',
      body: JSON.stringify({ name, class_level }),
    });
  }

  async uploadSyllabus(subjectId: string, file: File | null, unitsRaw: string): Promise<{ units: SyllabusUnit[] }> {
    const formData = new FormData();
    formData.append('subject_id', subjectId);
    if (file) {
      formData.append('file', file);
    }
    if (unitsRaw) {
      formData.append('units_raw', unitsRaw);
    }

    return this.request<{ units: SyllabusUnit[] }>('/syllabus/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getUnits(subjectId: string): Promise<SyllabusUnit[]> {
    return this.request<SyllabusUnit[]>(`/syllabus/${subjectId}/units`);
  }

  // Notes
  async generateNotes(subjectId: string, unitId: string, type: NoteType): Promise<Note> {
    return this.request<Note>('/notes/generate', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, unit_id: unitId, type }),
    });
  }

  async getNotesByUnit(unitId: string): Promise<Note[]> {
    return this.request<Note[]>(`/notes/${unitId}`);
  }

  // Tutor
  async createTutorSession(subjectId: string, mode: TutorMode): Promise<TutorSession> {
    return this.request<TutorSession>('/tutor/session', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, mode }),
    });
  }

  async sendTutorMessage(sessionId: string, message: string): Promise<TutorResponse> {
    return this.request<TutorResponse>('/tutor/message', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, message }),
    });
  }

  // Quiz
  async generateQuiz(subjectId: string, unitId: string, count: number = 5, difficulty: string = 'medium'): Promise<QuizQuestion[]> {
    return this.request<QuizQuestion[]>('/quiz/generate', {
      method: 'POST',
      body: JSON.stringify({ subject_id: subjectId, unit_id: unitId, count, difficulty }),
    });
  }

  async submitQuiz(unitId: string, answers: Record<string, string>): Promise<QuizResult> {
    return this.request<QuizResult>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ unit_id: unitId, answers }),
    });
  }
}

export const api = new ApiClient();
