import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, AlertTriangle, TrendingUp, Bookmark, RotateCcw } from 'lucide-react';
import { RadarChartComponent } from '@/components/RadarChart';
import { useReview } from '@/hooks/useReview';

const reportRadarData = [
  { domain: '经济学', current: 32 },
  { domain: '计算机', current: 54 },
  { domain: '管理学', current: 61 },
  { domain: '数据结构', current: 78 },
  { domain: '数据库', current: 85 },
  { domain: 'AI', current: 45 },
];

const weakPoints = [
  { name: '边际效应递减', domain: '经济学', mastery: 30 },
  { name: '凯恩斯主义', domain: '经济学', mastery: 45 },
  { name: '二叉树遍历', domain: '计算机科学', mastery: 50 },
];

const wrongQuestions = [
  { name: '机会成本的定义', domain: '经济学', wrongCount: 3 },
  { name: '二叉树的前序遍历', domain: '计算机', wrongCount: 2 },
  { name: 'SWOT 分析四要素', domain: '管理学', wrongCount: 2 },
];

export function ReportPage() {
  const navigate = useNavigate();
  const { report, fetchReport } = useReview();

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const totalScore = report?.totalScore ?? 72;

  return (
    <div className="space-y-5">
      {/* Header Score */}
      <div className="rounded-2xl border border-border/60 bg-bg-card p-8 text-center shadow-card">
        <div className="mb-2 text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          {totalScore}
        </div>
        <div className="text-base text-text-secondary">综合掌握度评分</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-700">
            <TrendingUp className="h-3 w-3" /> +5% 较上周
          </span>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-medium text-blue-700">
            347 题完成
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        {/* Radar Chart */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Brain className="h-5 w-5 text-primary" />
            各领域掌握度
          </h3>
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <RadarChartComponent data={reportRadarData} />
            </div>
          </div>
        </div>

        {/* Weak Points */}
        <div className="h-fit rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              薄弱知识点
            </h3>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
              3 项需加强
            </span>
          </div>
          <ul className="space-y-3">
            {weakPoints.map((wp) => (
              <li key={wp.name} className="flex items-center gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{wp.name}</div>
                  <div className="text-xs text-text-muted">{wp.domain}</div>
                </div>
                <div className="text-sm font-semibold text-red-500">{wp.mastery}%</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Trend Chart */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-5 w-5 text-secondary" />
            掌握趋势
          </h3>
          <div className="flex h-[200px] items-end justify-between gap-2">
            {[58, 60, 62, 59, 65, 68, 72].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-primary/30"
                  style={{ height: `${v * 2}px` }}
                />
                <span className="text-[10px] text-text-muted">
                  {['6/17', '6/18', '6/19', '6/20', '6/21', '6/22', '6/23'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wrong Questions */}
        <div className="rounded-2xl border border-border/60 bg-bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Bookmark className="h-5 w-5 text-red-500" />
              错题本
            </h3>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
              12 道错题
            </span>
          </div>
          <ul className="space-y-3">
            {wrongQuestions.map((wq) => (
              <li key={wq.name} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                <div>
                  <div className="text-sm font-medium">{wq.name}</div>
                  <div className="text-xs text-text-muted">
                    {wq.domain} · 答错 {wq.wrongCount} 次
                  </div>
                </div>
                <button className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text-secondary transition-all hover:border-primary-light hover:text-primary hover:bg-primary/[0.04]">
                  重做
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/review')}
            className="mt-3 w-full rounded-xl bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary/10"
          >
            <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> 重新做全部错题
          </button>
        </div>
      </div>
    </div>
  );
}
