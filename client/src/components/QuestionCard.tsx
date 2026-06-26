import { useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import type { ChoiceQuestion } from '@/types';

interface Props {
  question: ChoiceQuestion;
  questionNumber: number;
  totalQuestions: number;
  onNext: () => void;
  onSubmit: (questionId: string, answer: string) => Promise<any>;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onNext,
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    correctAnswer: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = async (letter: string) => {
    if (selected || submitting) return;
    setSelected(letter);
    setSubmitting(true);
    const res = await onSubmit(question.id, letter);
    if (res) {
      setResult(res);
    }
    setSubmitting(false);
  };

  const getOptionClass = (letter: string) => {
    const base =
      'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-[15px] transition-all duration-300 cursor-pointer';
    if (!selected) {
      return `${base} border-border hover:border-primary-light hover:bg-primary/[0.03]`;
    }
    if (result) {
      if (letter === result.correctAnswer) {
        return `${base} border-green-500 bg-green-50`;
      }
      if (letter === selected && letter !== result.correctAnswer) {
        return `${base} border-red-500 bg-red-50`;
      }
      return `${base} border-border opacity-50`;
    }
    return base;
  };

  const getLetterClass = (letter: string) => {
    const base =
      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold transition-all duration-300';
    if (!selected) {
      return `${base} bg-slate-100 text-text-secondary group-hover:bg-primary/10 group-hover:text-primary`;
    }
    if (result) {
      if (letter === result.correctAnswer) {
        return `${base} bg-green-500 text-white`;
      }
      if (letter === selected && letter !== result.correctAnswer) {
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
          选择题
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
              disabled={!!selected}
              onClick={() => handleSelect(letter)}
              className={`group ${getOptionClass(letter)} text-left`}
            >
              <span className={getLetterClass(letter)}>{letter}</span>
              <span className="flex-1">{opt.slice(2).trim()}</span>
            </button>
          );
        })}
      </div>

      {result && (
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
          {selected && (
            <button
              onClick={() => {
                setSelected(null);
                setResult(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary/10"
            >
              <RotateCcw className="h-4 w-4" /> 重做
            </button>
          )}
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
          >
            {questionNumber === totalQuestions ? '查看结果' : '下一题'}
            <ArrowRight className="h-4 w-4" />
          </button>
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
