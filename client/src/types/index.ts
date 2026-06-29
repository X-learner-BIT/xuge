// === 用户 ===
export interface User {
  id: string;
  phone?: string | null;
  email?: string | null;
  nickname: string | null;
  role?: string;
  createdAt: string;
}

export interface LoginDto {
  account: string;
  password: string;
}

export interface RegisterDto {
  phone: string;
  password: string;
  confirmPassword: string;
  nickname?: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// === 笔记 ===
export interface Note {
  id: string;
  title: string;
  contentType: 'pdf' | 'docx' | 'text';
  content: string | null;
  aiSummary: string | null;
  tags: string[];
  status: 'analyzing' | 'completed' | 'failed';
  knowledgePoints: KnowledgePoint[];
  createdAt: string;
}

// === 知识点 ===
export interface KnowledgePoint {
  id: string;
  noteId: string;
  name: string;
  description: string | null;
  domain: string | null;
  mastery: number;
}

// === 复习题目 ===
export interface ChoiceQuestion {
  id: string;
  questionType: 'choice' | 'fill';
  answerType?: string;
  knowledgePoint: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

// === 答题记录 ===
export interface ReviewRecord {
  id: string;
  questionText: string;
  userAnswer: string;
  isCorrect: boolean;
  aiExplanation: string;
}

// === 弱项报告 ===
export interface WeaknessReport {
  totalScore: number;
  totalQuestions: number;
  correctCount: number;
  domainMastery: {
    domain: string;
    mastery: number;
  }[];
  weakPoints: {
    name: string;
    domain: string;
    mastery: number;
  }[];
  knowledgePointStats: {
    total: number;
    mastered: number;
    improving: number;
    weak: number;
  };
  questionTypeStats: {
    choice: { total: number; correct: number };
    fill: { total: number; correct: number };
  };
  recentRecords: {
    id: string;
    questionText: string;
    isCorrect: boolean;
    createdAt: string;
    domain: string;
    questionType: string;
  }[];
  noteCount: number;
  streakDays: number;
}

// === 领域掌握度 ===
export interface DomainMasteryItem {
  domain: string;
  mastery: number;
  pointCount: number;
}
