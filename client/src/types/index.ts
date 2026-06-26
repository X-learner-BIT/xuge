// === 用户 ===
export interface User {
  id: string;
  email: string;
  nickname: string | null;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nickname?: string;
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

// === 选择题 ===
export interface ChoiceQuestion {
  id: string;
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
}

// === 领域掌握度 ===
export interface DomainMasteryItem {
  domain: string;
  mastery: number;
  pointCount: number;
}
