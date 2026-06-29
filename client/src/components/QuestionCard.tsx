import { useState } from 'react';
import { ArrowRight, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import type { ChoiceQuestion } from '@/types';

interface Props {
  question: ChoiceQuestion;
  questionNumber: number;
  totalQuestions: number;
  phase: 'answering' | 'reviewing';
  userAnswer: string;
  result?: {
    isCorrect: boolean;
    explanation: string;
    correctAnswer: string;
  };
  onAnswerChange: (answer: string) => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  onSubmitAll?: () => void;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  phase,
  userAnswer,
  result,
  onAnswerChange,
  onPrev,
  onNext,
  isFirst,
  isLast,
  onSubmitAll,
}: Props) {
  if (question.questionType === 'fill') {
    return (
      <FillQuestionCard
        question={question}
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
        phase={phase}
        userAnswer={userAnswer}
        result={result}
        onAnswerChange={onAnswerChange}
        onPrev={onPrev}
        onNext={onNext}
        isFirst={isFirst}
        isLast={isLast}
        onSubmitAll={onSubmitAll}
      />
    );
  }

  return (
    <ChoiceQuestionCard
      question={question}
      questionNumber={questionNumber}
      totalQuestions={totalQuestions}
      phase={phase}
      userAnswer={userAnswer}
      result={result}
      onAnswerChange={onAnswerChange}
      onPrev={onPrev}
      onNext={onNext}
      isFirst={isFirst}
      isLast={isLast}
      onSubmitAll={onSubmitAll}
    />
  );
}

// ====== 选择题卡片 ======
function ChoiceQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  phase,
  userAnswer,
  result,
  onAnswerChange,
  onPrev,
  onNext,
  isFirst,
  isLast,
  onSubmitAll,
}: Props) {
  const isReviewing = phase === 'reviewing';
  // 判断是否为多选题：优先使用 answerType，如果没有则根据 correctAnswer 推断
  const isMultiSelect = question.answerType === 'multiple' || (!question.answerType && question.correctAnswer.includes(','));

  // 多选题：解析当前已选中的字母集合
  const selectedLetters = userAnswer
    ? userAnswer.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const toggleLetter = (letter: string) => {
    if (isReviewing) return;
    if (isMultiSelect) {
      const exists = selectedLetters.includes(letter);
      const newSelected = exists
        ? selectedLetters.filter((l) => l !== letter)
        : [...selectedLetters, letter];
      // 按字母顺序排序
      newSelected.sort();
      onAnswerChange(newSelected.join(','));
    } else {
      onAnswerChange(letter);
    }
  };

  const getOptionClass = (letter: string) => {
    const base =
      'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-[15px] transition-all duration-300';

    if (!isReviewing) {
      const isSelected = selectedLetters.includes(letter);
      return `${base} ${isSelected ? 'border-primary bg-primary/[0.03]' : 'border-border hover:border-primary-light hover:bg-primary/[0.03]'} cursor-pointer`;
    }

    // 查看结果阶段
    if (result) {
      const correctLetters = result.correctAnswer.split(',').map((s) => s.trim());
      const isCorrect = correctLetters.includes(letter);
      const isUserSelected = selectedLetters.includes(letter);
      if (isCorrect) {
        return `${base} border-green-500 bg-green-50`;
      }
      if (isUserSelected && !isCorrect) {
        return `${base} border-red-500 bg-red-50`;
      }
      return `${base} border-border opacity-50`;
    }
    return base;
  };

  const getLetterClass = (letter: string) => {
    const base =
      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold transition-all duration-300';

    if (!isReviewing) {
      const isSelected = selectedLetters.includes(letter);
      return `${base} ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-text-secondary group-hover:bg-primary/10 group-hover:text-primary'}`;
    }

    if (result) {
      const correctLetters = result.correctAnswer.split(',').map((s) => s.trim());
      const isCorrect = correctLetters.includes(letter);
      const isUserSelected = selectedLetters.includes(letter);
      if (isCorrect) {
        return `${base} bg-green-500 text-white`;
      }
      if (isUserSelected && !isCorrect) {
        return `${base} bg-red-500 text-white`;
      }
      return `${base} bg-slate-100 text-text-secondary`;
    }
    return base;
  };

  return (
    <div className="mx-auto max-w-[680px] rounded-2xl border border-border/60 bg-bg-card p-7 shadow-card">
      <div className="mb-3 flex items-center gap-3 text-[13px] text-text-muted">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
          {isMultiSelect ? '多选题' : '单选题'}
        </span>
        <span className="flex items-center gap-1">
          <LightbulbMini /> {question.knowledgePoint}
        </span>
      </div>

      <div className="mb-6 text-lg font-semibold leading-relaxed">{question.question}</div>

      <div className="flex flex-col gap-2.5">
        {question.options.map((opt) => {
          const letter = opt.charAt(0);
          return (
            <button
              key={letter}
              disabled={isReviewing}
              onClick={() => toggleLetter(letter)}
              className={`group ${getOptionClass(letter)} text-left`}
            >
              <span className={getLetterClass(letter)}>{letter}</span>
              <span className="flex-1">{opt.slice(2).trim()}</span>
            </button>
          );
        })}
      </div>

      {isReviewing && result && (
        <div className="mt-4 rounded-xl border-l-[3px] border-primary bg-slate-50 p-5 text-sm leading-relaxed">
          <strong className="text-text-primary">
            {result.isCorrect ? '✅ 正确！' : '❌ 错误'}
          </strong>
          <p className="mt-1 text-text-secondary">{result.explanation}</p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-text-muted">
          第 {questionNumber} / {totalQuestions} 题
        </span>
        <div className="flex gap-2.5">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-semibold text-text-secondary transition-all duration-300 hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]"
            >
              <ArrowLeft className="h-4 w-4" /> 上一题
            </button>
          )}

          {!isLast && (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
            >
              下一题 <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {isLast && !isReviewing && onSubmitAll && (
            <button
              onClick={onSubmitAll}
              disabled={!userAnswer}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> 提交所有答案
            </button>
          )}

          {isLast && isReviewing && (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
            >
              查看结果 <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ====== 简答题卡片 ======
function FillQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  phase,
  userAnswer,
  result,
  onAnswerChange,
  onPrev,
  onNext,
  isFirst,
  isLast,
  onSubmitAll,
}: Props) {
  const isReviewing = phase === 'reviewing';
  const [draft, setDraft] = useState(userAnswer);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onAnswerChange(trimmed);
    }
  };

  return (
    <div className="mx-auto max-w-[680px] rounded-2xl border border-border/60 bg-bg-card p-7 shadow-card">
      <div className="mb-3 flex items-center gap-3 text-[13px] text-text-muted">
        <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700">
          简答题
        </span>
        <span className="flex items-center gap-1">
          <LightbulbMini /> {question.knowledgePoint}
        </span>
      </div>

      <div className="mb-4 text-lg font-semibold leading-relaxed">{question.question}</div>

      {/* 答题提示 */}
      {question.options.length > 0 && (
        <div className="mb-4 rounded-xl bg-blue-50 p-4">
          <div className="mb-1.5 text-xs font-semibold text-blue-700">答题提示</div>
          <ul className="space-y-1">
            {question.options.map((hint, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                {hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 答题输入框 */}
      {!isReviewing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="在此输入你的回答…"
            rows={6}
            className="w-full resize-y rounded-xl border border-border bg-slate-50 px-4 py-3 text-sm leading-relaxed text-text-primary outline-none transition-all focus:border-primary-light focus:bg-white focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
          />
          <button
            onClick={handleSubmit}
            disabled={!draft.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> 保存答案
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 用户答案 */}
          <div className="rounded-xl border border-border bg-slate-50 p-4">
            <div className="mb-1.5 text-xs font-semibold text-text-secondary">你的回答</div>
            <div className="whitespace-pre-wrap text-sm text-text-primary">{userAnswer || '（未作答）'}</div>
          </div>

          {/* 标准答案 */}
          <div className="rounded-xl border-l-[3px] border-green-500 bg-green-50 p-4">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-green-700">
              <CheckCircle className="h-3.5 w-3.5" /> 标准答案
            </div>
            <div className="whitespace-pre-wrap text-sm text-green-800">{result?.correctAnswer || question.correctAnswer}</div>
          </div>

          {/* 解析 */}
          <div className="rounded-xl border-l-[3px] border-primary bg-slate-50 p-4 text-sm leading-relaxed">
            <strong className="text-text-primary">评分标准</strong>
            <p className="mt-1 text-text-secondary">{result?.explanation || question.explanation}</p>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm text-text-muted">
          第 {questionNumber} / {totalQuestions} 题
        </span>
        <div className="flex gap-2.5">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-2 text-sm font-semibold text-text-secondary transition-all duration-300 hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]"
            >
              <ArrowLeft className="h-4 w-4" /> 上一题
            </button>
          )}

          {!isLast && (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
            >
              下一题 <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {isLast && !isReviewing && onSubmitAll && (
            <button
              onClick={onSubmitAll}
              disabled={!userAnswer}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> 提交所有答案
            </button>
          )}

          {isLast && isReviewing && (
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
            >
              查看结果 <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function LightbulbMini() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2 1.5-3.5A6 6 0 0 0 6 8c0 1.5.5 2.5 1.5 3.5.8.8 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}
