import { api } from './api';
import type { ChoiceQuestion, WeaknessReport, DomainMasteryItem } from '@/types';

export interface TrendItem {
  date: string;
  count: number;
  correctCount: number;
  mastery: number;
}

export interface WrongQuestionItem {
  id: string;
  name: string;
  domain: string;
  wrongCount: number;
}

export interface AiChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const reviewApi = {
  generateQuestions: (params: {
    count: number;
    questionType: 'choice' | 'fill';
    noteIds: string[];
    creativeMode?: boolean;
  }) =>
    api
      .post<{ questions: ChoiceQuestion[] }>('/review/generate', params)
      .then((res) => res.data),
  submitAnswer: (questionId: string, userAnswer: string) =>
    api
      .post<{
        isCorrect: boolean;
        explanation: string;
        correctAnswer: string;
        updatedMastery: number;
        questionType: string;
      }>('/review/submit', { questionId, userAnswer })
      .then((res) => res.data),
  aiChat: (params: { noteIds: string[]; messages: AiChatMessage[] }) =>
    api
      .post<{ reply: string }>('/review/ai-chat', params)
      .then((res) => res.data),
  getReport: () =>
    api.get<WeaknessReport>('/review/report').then((res) => res.data),
  getDomainMastery: (noteId?: string) =>
    api
      .get<{ domains: DomainMasteryItem[] }>('/review/domain-mastery', {
        params: noteId ? { noteId } : undefined,
      })
      .then((res) => res.data),
  getTrends: () =>
    api.get<{ trends: TrendItem[] }>('/review/trends').then((res) => res.data),
  getWrongQuestions: () =>
    api
      .get<{ items: WrongQuestionItem[] }>('/review/wrong-questions')
      .then((res) => res.data),
};
