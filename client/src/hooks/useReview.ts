import { useState, useCallback } from 'react';
import { reviewApi } from '@/services/review';
import type { ChoiceQuestion, WeaknessReport, DomainMasteryItem } from '@/types';

export function useReview() {
  const [questions, setQuestions] = useState<ChoiceQuestion[]>([]);
  const [report, setReport] = useState<WeaknessReport | null>(null);
  const [domainMastery, setDomainMastery] = useState<DomainMasteryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuestions = useCallback(async (count = 5) => {
    setLoading(true);
    try {
      const data = await reviewApi.generateQuestions(count);
      setQuestions(data.questions);
      setError(null);
      return data.questions;
    } catch (err: any) {
      setError(err.response?.data?.message || '生成题目失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(async (questionId: string, userAnswer: string) => {
    try {
      return await reviewApi.submitAnswer(questionId, userAnswer);
    } catch {
      return null;
    }
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewApi.getReport();
      setReport(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取报告失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDomainMastery = useCallback(async () => {
    try {
      const data = await reviewApi.getDomainMastery();
      setDomainMastery(data.domains);
    } catch {
      // silent
    }
  }, []);

  return {
    questions,
    report,
    domainMastery,
    loading,
    error,
    generateQuestions,
    submitAnswer,
    fetchReport,
    fetchDomainMastery,
  };
}
