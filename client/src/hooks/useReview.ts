import { useState, useCallback } from 'react';
import { reviewApi } from '@/services/review';
import type { ChoiceQuestion, WeaknessReport, DomainMasteryItem } from '@/types';
import type { TrendItem, WrongQuestionItem, AiChatMessage } from '@/services/review';

export function useReview() {
  const [questions, setQuestions] = useState<ChoiceQuestion[]>([]);
  const [report, setReport] = useState<WeaknessReport | null>(null);
  const [domainMastery, setDomainMastery] = useState<DomainMasteryItem[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestionItem[]>([]);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuestions = useCallback(async (params: {
    count: number;
    questionType: 'choice' | 'fill';
    noteIds: string[];
    creativeMode?: boolean;
  }) => {
    setLoading(true);
    try {
      const data = await reviewApi.generateQuestions(params);
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

  const sendAiMessage = useCallback(async (noteIds: string[], content: string) => {
    setAiLoading(true);
    try {
      const newMessages: AiChatMessage[] = [...aiMessages, { role: 'user', content }];
      const data = await reviewApi.aiChat({ noteIds, messages: newMessages });
      setAiMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      return data.reply;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'AI 对话失败';
      setAiMessages([...aiMessages, { role: 'user', content }, { role: 'assistant', content: `❌ ${errorMsg}` }]);
      return null;
    } finally {
      setAiLoading(false);
    }
  }, [aiMessages]);

  const resetAiChat = useCallback(() => {
    setAiMessages([]);
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

  const fetchDomainMastery = useCallback(async (noteId?: string) => {
    try {
      const data = await reviewApi.getDomainMastery(noteId);
      setDomainMastery(data.domains);
    } catch {
      // silent
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    try {
      const data = await reviewApi.getTrends();
      setTrends(data.trends);
    } catch {
      // silent
    }
  }, []);

  const fetchWrongQuestions = useCallback(async () => {
    try {
      const data = await reviewApi.getWrongQuestions();
      setWrongQuestions(data.items);
    } catch {
      // silent
    }
  }, []);

  return {
    questions,
    report,
    domainMastery,
    trends,
    wrongQuestions,
    aiMessages,
    aiLoading,
    loading,
    error,
    generateQuestions,
    submitAnswer,
    sendAiMessage,
    resetAiChat,
    fetchReport,
    fetchDomainMastery,
    fetchTrends,
    fetchWrongQuestions,
  };
}
