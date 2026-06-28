import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  ArrowRight,
  Trophy,
  BookOpen,
  MessageSquare,
  PenLine,
  CheckSquare,
  Send,
  RotateCcw,
  Brain,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { QuestionCard } from '@/components/QuestionCard';
import { useReview } from '@/hooks/useReview';
import { useNotes } from '@/hooks/useNotes';
import type { ChoiceQuestion } from '@/types';

type ReviewMode = 'choice' | 'fill' | 'ai';
type PageState = 'settings' | 'reviewing' | 'finished' | 'ai-chat';
type Phase = 'answering' | 'reviewing';

export function ReviewPage() {
  const navigate = useNavigate();
  const { notes } = useNotes();
  const {
    questions,
    generateQuestions,
    submitAnswer,
    sendAiMessage,
    resetAiChat,
    aiMessages,
    aiLoading,
    loading,
    error,
  } = useReview();

  const [pageState, setPageState] = useState<PageState>('settings');
  const [reviewMode, setReviewMode] = useState<ReviewMode>('choice');
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [customCount, setCustomCount] = useState<string>('5');
  const [useCustomCount, setUseCustomCount] = useState(false);
  const [showNoteSelector, setShowNoteSelector] = useState(false);

  // 答题状态（提升到页面级别，避免组件复用导致状态错乱）
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { isCorrect: boolean; explanation: string; correctAnswer: string }>>({});
  const [phase, setPhase] = useState<Phase>('answering');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [submittingAll, setSubmittingAll] = useState(false);

  // AI 对话状态
  const [aiInput, setAiInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const completedNotes = notes.filter((n) => n.status === 'completed');

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [aiMessages]);

  const toggleNote = (noteId: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  const selectAllNotes = () => {
    setSelectedNoteIds(completedNotes.map((n) => n.id));
  };

  const clearNoteSelection = () => {
    setSelectedNoteIds([]);
  };

  const handleStart = async () => {
    if (reviewMode === 'ai') {
      resetAiChat();
      setPageState('ai-chat');
      await sendAiMessage(selectedNoteIds, '开始复习');
      return;
    }

    const count = useCustomCount ? Math.min(Math.max(Number(customCount) || 5, 1), 20) : questionCount;
    const generated = await generateQuestions({
      count,
      questionType: reviewMode,
      noteIds: selectedNoteIds,
    });

    if (generated.length > 0) {
      setCurrentIndex(0);
      setAnswers({});
      setResults({});
      setPhase('answering');
      setScore({ correct: 0, total: 0 });
      setPageState('reviewing');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else if (phase === 'reviewing') {
      // 查看结果阶段，最后一题点击"查看结果"
      const correct = Object.values(results).filter((r) => r.isCorrect).length;
      setScore({ correct, total: questions.length });
      setPageState('finished');
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitAll = async () => {
    if (submittingAll) return;
    setSubmittingAll(true);

    const newResults: Record<string, { isCorrect: boolean; explanation: string; correctAnswer: string }> = {};
    let correct = 0;

    for (const q of questions) {
      const answer = answers[q.id] || '';
      const res = await submitAnswer(q.id, answer);
      if (res) {
        newResults[q.id] = {
          isCorrect: res.isCorrect,
          explanation: res.explanation,
          correctAnswer: res.correctAnswer,
        };
        if (res.isCorrect) correct++;
      }
    }

    setResults(newResults);
    setScore({ correct, total: questions.length });
    setPhase('reviewing');
    setSubmittingAll(false);
  };

  const handleAiSend = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const content = aiInput.trim();
    setAiInput('');
    await sendAiMessage(selectedNoteIds, content);
  };

  const handleRestart = () => {
    setPageState('settings');
    setCurrentIndex(0);
    setAnswers({});
    setResults({});
    setPhase('answering');
    setScore({ correct: 0, total: 0 });
    resetAiChat();
  };

  // ====== 设置页面 ======
  if (pageState === 'settings') {
    return (
      <div className="mx-auto max-w-[720px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
            <Brain className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold">开始复习</h2>
          <p className="mt-1 text-sm text-text-secondary">选择复习方式和范围，定制你的复习计划</p>
        </div>

        <div className="space-y-5">
          {/* 复习方式 */}
          <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-text-secondary">选择复习方式</h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setReviewMode('choice')}
                className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition-all ${
                  reviewMode === 'choice'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-text-secondary hover:border-primary-light hover:text-primary'
                }`}
              >
                <CheckSquare className="h-6 w-6" />
                做题
                <span className="text-[11px] text-text-muted">选择题</span>
              </button>
              <button
                onClick={() => setReviewMode('fill')}
                className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition-all ${
                  reviewMode === 'fill'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-text-secondary hover:border-primary-light hover:text-primary'
                }`}
              >
                <PenLine className="h-6 w-6" />
                简答题
                <span className="text-[11px] text-text-muted">手写回答</span>
              </button>
              <button
                onClick={() => setReviewMode('ai')}
                className={`flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-sm font-medium transition-all ${
                  reviewMode === 'ai'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-text-secondary hover:border-primary-light hover:text-primary'
                }`}
              >
                <MessageSquare className="h-6 w-6" />
                AI 对话
                <span className="text-[11px] text-text-muted">互动答题</span>
              </button>
            </div>
          </div>

          {/* 笔记选择 */}
          <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-secondary">选择复习范围</h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllNotes}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  全选
                </button>
                <button
                  onClick={clearNoteSelection}
                  className="text-xs font-medium text-text-muted hover:text-text-secondary"
                >
                  清空
                </button>
              </div>
            </div>

            {completedNotes.length === 0 ? (
              <div className="rounded-xl bg-slate-50 py-6 text-center text-sm text-text-muted">
                <BookOpen className="mx-auto mb-2 h-6 w-6 text-text-muted/40" />
                暂无已分析完成的笔记，请先上传笔记
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setShowNoteSelector(!showNoteSelector)}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm transition-all hover:border-primary-light"
                >
                  <span>
                    {selectedNoteIds.length === 0
                      ? '全部笔记'
                      : `已选择 ${selectedNoteIds.length} 个笔记`}
                  </span>
                  {showNoteSelector ? (
                    <ChevronUp className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  )}
                </button>

                {showNoteSelector && (
                  <div className="max-h-[240px] overflow-y-auto rounded-xl border border-border bg-bg-card p-2">
                    {completedNotes.map((note) => (
                      <label
                        key={note.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedNoteIds.includes(note.id)}
                          onChange={() => toggleNote(note.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{note.title}</div>
                          <div className="text-xs text-text-muted">
                            {note.knowledgePoints?.length || 0} 个知识点 · {note.tags?.slice(0, 2).join(', ')}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 题数选择（非 AI 对话模式） */}
          {reviewMode !== 'ai' && (
            <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-text-secondary">选择题数</h3>
              <div className="flex flex-wrap gap-2">
                {[3, 5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setQuestionCount(num);
                      setUseCustomCount(false);
                    }}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      !useCustomCount && questionCount === num
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-primary'
                        : 'border border-border text-text-secondary hover:border-primary-light hover:text-primary'
                    }`}
                  >
                    {num} 题
                  </button>
                ))}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUseCustomCount(true)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      useCustomCount
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-primary'
                        : 'border border-border text-text-secondary hover:border-primary-light hover:text-primary'
                    }`}
                  >
                    自定义
                  </button>
                  {useCustomCount && (
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={customCount}
                      onChange={(e) => setCustomCount(e.target.value)}
                      className="w-16 rounded-xl border border-border bg-slate-50 px-3 py-2 text-center text-sm outline-none focus:border-primary-light"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 开始按钮 */}
          <button
            onClick={handleStart}
            disabled={loading || completedNotes.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-3 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50"
          >
            {loading ? (
              <>
                <List className="h-4 w-4 animate-spin" /> 正在生成题目…
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                {reviewMode === 'ai' ? '开始 AI 对话复习' : '开始答题'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ====== AI 对话模式 ======
  if (pageState === 'ai-chat') {
    return (
      <div className="mx-auto flex h-[calc(100vh-120px)] max-w-[720px] flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-5 w-5 text-primary" />
            AI 对话复习
          </h3>
          <button
            onClick={handleRestart}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary-light hover:text-primary"
          >
            结束对话
          </button>
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-bg-card p-4 shadow-card">
          <div className="space-y-4">
            {aiMessages.length === 0 && (
              <div className="py-12 text-center text-sm text-text-muted">
                <Brain className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
                AI 导师正在准备题目，请稍候…
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white'
                      : 'bg-slate-50 text-text-primary'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-text-muted">
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
                  <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* 输入区域 */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
            placeholder="输入你的回答…"
            className="flex-1 rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm text-text-primary outline-none transition-all focus:border-primary-light focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
          />
          <button
            onClick={handleAiSend}
            disabled={!aiInput.trim() || aiLoading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // ====== 答题完成页面 ======
  if (pageState === 'finished') {
    const pct = Math.round((score.correct / score.total) * 100) || 0;
    const grade =
      pct >= 90 ? '优秀' : pct >= 70 ? '良好' : pct >= 60 ? '一般' : '需努力';
    const gradeColor =
      pct >= 90
        ? 'text-green-600'
        : pct >= 70
        ? 'text-blue-600'
        : pct >= 60
        ? 'text-yellow-600'
        : 'text-red-500';

    return (
      <div className="flex flex-col items-center py-12">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-xl">
          <Trophy className="h-10 w-10" />
        </div>
        <div className="mb-2 text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          {score.correct}/{score.total}
        </div>
        <div className="mb-2 text-lg text-text-secondary">
          正确率 {pct}% · {grade}
        </div>
        <div className={`mb-8 text-2xl font-bold ${gradeColor}`}>{grade}</div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/report')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
          >
            查看弱项报告
          </button>
          <button
            onClick={handleRestart}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-6 py-2.5 text-sm font-semibold text-text-secondary transition-all duration-300 hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]"
          >
            <RotateCcw className="h-4 w-4" /> 再来一轮
          </button>
        </div>
      </div>
    );
  }

  // ====== 答题中页面 ======
  const currentQuestion = questions[currentIndex];
  const displayQuestions = questions;
  const progressText = phase === 'answering' ? '答题中' : '查看结果';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
            {reviewMode === 'choice' ? '选择题' : '简答题'}
          </span>
          <span>
            第 {currentIndex + 1} / {displayQuestions.length} 题 · {progressText}
          </span>
        </div>
        <button
          onClick={handleRestart}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-primary-light hover:text-primary"
        >
          退出
        </button>
      </div>

      {/* 答题进度条（仅在答题阶段显示） */}
      {phase === 'answering' && (
        <div className="mb-4 flex gap-1">
          {displayQuestions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i === currentIndex
                  ? 'bg-primary'
                  : answers[q.id]
                  ? 'bg-primary/40'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      )}

      <QuestionCard
        key={currentQuestion.id}
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={displayQuestions.length}
        phase={phase}
        userAnswer={answers[currentQuestion.id] || ''}
        result={results[currentQuestion.id]}
        onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
        onPrev={handlePrev}
        onNext={handleNext}
        isFirst={currentIndex === 0}
        isLast={currentIndex === displayQuestions.length - 1}
        onSubmitAll={handleSubmitAll}
      />

      {submittingAll && (
        <div className="mt-4 text-center text-sm text-text-muted">
          <List className="mx-auto mb-2 h-5 w-5 animate-spin" />
          正在提交答案并批改…
        </div>
      )}
    </div>
  );
}
