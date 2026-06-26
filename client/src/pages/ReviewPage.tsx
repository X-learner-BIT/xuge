import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, ArrowRight, Trophy } from 'lucide-react';
import { QuestionCard } from '@/components/QuestionCard';
import { useReview } from '@/hooks/useReview';
import type { ChoiceQuestion } from '@/types';

const demoQuestions: ChoiceQuestion[] = [
  {
    id: 'q1',
    knowledgePoint: '边际效应递减',
    question: '以下哪项最能解释"为什么第三块披萨带来的满足感不如第一块"？',
    options: ['A. 边际效应递减', 'B. 机会成本', 'C. 供需关系', 'D. 沉没成本'],
    correctAnswer: 'A',
    explanation:
      '边际效应递减（Diminishing Marginal Utility）指的是随着消费量的增加，每新增一单位消费带来的额外满足感逐渐减少。第一块披萨最解饿，所以满足感最高；到第三块时已经快饱了，满足感自然降低。',
  },
  {
    id: 'q2',
    knowledgePoint: '机会成本',
    question: '你花 2 小时看了一场电影，这 2 小时你本可以打工赚 100 元。这 100 元属于什么成本？',
    options: ['A. 沉没成本', 'B. 机会成本', 'C. 固定成本', 'D. 边际成本'],
    correctAnswer: 'B',
    explanation:
      '机会成本是指为了选择某项活动而放弃的最佳替代活动的价值。看电影的机会成本就是你放弃打工所能获得的 100 元收入。',
  },
  {
    id: 'q3',
    knowledgePoint: '完全竞争市场',
    question: '在完全竞争市场中，企业的长期经济利润通常是多少？',
    options: ['A. 正利润', 'B. 负利润', 'C. 零利润', 'D. 垄断利润'],
    correctAnswer: 'C',
    explanation:
      '在完全竞争市场的长期均衡中，企业可以自由进入和退出市场。如果存在正利润，新企业会进入，供给增加，价格下降，直到经济利润为零；如果亏损，企业退出，供给减少，价格上升，直到亏损消失。',
  },
  {
    id: 'q4',
    knowledgePoint: '需求弹性',
    question: '如果某商品价格上涨 10%，需求量下降 20%，该商品的需求价格弹性属于？',
    options: ['A. 缺乏弹性', 'B. 单位弹性', 'C. 富有弹性', 'D. 完全无弹性'],
    correctAnswer: 'C',
    explanation:
      '需求价格弹性 = 需求量变动百分比 / 价格变动百分比 = 20% / 10% = 2 > 1，因此属于富有弹性（elastic）。当弹性大于 1 时，需求量变动幅度大于价格变动幅度。',
  },
  {
    id: 'q5',
    knowledgePoint: '垄断市场',
    question: '垄断企业利润最大化的产量条件是？',
    options: ['A. 平均成本最低', 'B. 边际收益等于边际成本', 'C. 价格等于边际成本', 'D. 总收益最大'],
    correctAnswer: 'B',
    explanation:
      '所有企业（包括垄断企业）利润最大化的通用条件是边际收益（MR）等于边际成本（MC）。垄断企业的特殊之处在于其边际收益曲线位于需求曲线下方，因此其定价高于边际成本。',
  },
];

export function ReviewPage() {
  const navigate = useNavigate();
  const { questions, generateQuestions, submitAnswer } = useReview();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const displayQuestions = questions.length > 0 ? questions : demoQuestions;

  useEffect(() => {
    if (!started && questions.length === 0) {
      generateQuestions(5);
    }
  }, [started, questions.length, generateQuestions]);

  const handleNext = () => {
    if (currentIndex < displayQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  const handleSubmit = async (questionId: string, answer: string) => {
    const res = await submitAnswer(questionId, answer);
    if (res?.isCorrect) {
      setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
    } else {
      setScore((s) => ({ ...s, total: s.total + 1 }));
    }
    return res;
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
          <List className="h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-bold">今天要复习的内容已就绪</h3>
        <p className="mb-8 text-text-secondary">
          即将覆盖 <strong>{displayQuestions.length}</strong> 个知识点
        </p>
        <button
          onClick={() => setStarted(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-8 py-3 text-[15px] font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
        >
          <ArrowRight className="h-5 w-5" /> 开始答题
        </button>
      </div>
    );
  }

  if (finished) {
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
            onClick={() => {
              setStarted(false);
              setFinished(false);
              setCurrentIndex(0);
              setScore({ correct: 0, total: 0 });
              generateQuestions(5);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-6 py-2.5 text-sm font-semibold text-text-secondary transition-all duration-300 hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]"
          >
            再来一轮
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <QuestionCard
        question={displayQuestions[currentIndex]}
        questionNumber={currentIndex + 1}
        totalQuestions={displayQuestions.length}
        onNext={handleNext}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
