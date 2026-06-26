import { api } from './api';
import type { ChoiceQuestion, WeaknessReport, DomainMasteryItem } from '@/types';

export const reviewApi = {
  generateQuestions: (count = 5) =>
    api
      .post<{ questions: ChoiceQuestion[] }>('/review/generate', { count })
      .then((res) => res.data),
  submitAnswer: (questionId: string, userAnswer: string) =>
    api
      .post<{
        isCorrect: boolean;
        explanation: string;
        correctAnswer: string;
        updatedMastery: number;
      }>('/review/submit', { questionId, userAnswer })
      .then((res) => res.data),
  getReport: () =>
    api.get<WeaknessReport>('/review/report').then((res) => res.data),
  getDomainMastery: () =>
    api
      .get<{ domains: DomainMasteryItem[] }>('/domain-mastery')
      .then((res) => res.data),
};
