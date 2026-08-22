export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  org_id: string;
  email: string;
  role: UserRole;
  full_name: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  plan_tier: string;
  credits_balance: number;
  created_at: string;
}

export interface MeData {
  user: User;
  organization: Organization;
}

export interface Subject {
  id: string;
  org_id: string;
  name: string;
  class_level: string;
}

export interface SyllabusUnit {
  id: string;
  subject_id: string;
  unit_name: string;
  order_index: number;
}

export type NoteType = 'detailed' | 'exam' | 'revision' | 'last_minute' | 'cheat_sheet';

export interface Note {
  id: string;
  subject_id: string;
  unit_id: string;
  type: NoteType;
  content: string;
  generated_at: string;
}

export type TutorMode = 'beginner' | 'standard' | 'interview';

export interface TutorSession {
  id: string;
  student_id: string;
  subject_id: string;
  mode: TutorMode;
  created_at: string;
}

export interface TutorResponse {
  reply: string;
  sources: string[];
}


export type QuizType = 'mcq' | 'true_false' | 'fill_blank';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question_text: string;
  options: string[] | null;
  difficulty: string;
}

export interface QuizBreakdown {
  question_id: string;
  question_text: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
  breakdown: QuizBreakdown[];
}
