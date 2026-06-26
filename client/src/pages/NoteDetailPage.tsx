import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, Tag, Trash2, Play, CheckCircle } from 'lucide-react';
import { KnowledgePointCard } from '@/components/KnowledgePointCard';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/utils/formatDate';
import type { Note, KnowledgePoint } from '@/types';

// Demo note for preview
const demoNote: Note & { knowledgePoints: KnowledgePoint[] } = {
  id: '1',
  title: '微观经济学原理',
  contentType: 'pdf',
  aiSummary:
    '本文介绍了微观经济学的基本概念，包括供需关系、边际效应、弹性、市场结构等核心理论。通过图表分析了完全竞争市场与垄断市场的差异，以及价格机制在资源配置中的作用。',
  tags: ['经济学', '微观'],
  status: 'completed',
  knowledgePoints: [
    {
      id: 'k1',
      noteId: '1',
      name: '供需关系',
      description: '价格由供给与需求的平衡决定',
      domain: '经济学',
      mastery: 45,
    },
    {
      id: 'k2',
      noteId: '1',
      name: '边际效应递减',
      description: '每增加一单位消费，额外满足感逐渐减少',
      domain: '经济学',
      mastery: 30,
    },
    {
      id: 'k3',
      noteId: '1',
      name: '需求弹性',
      description: '价格变化对需求量的影响程度',
      domain: '经济学',
      mastery: 55,
    },
    {
      id: 'k4',
      noteId: '1',
      name: '完全竞争市场',
      description: '无数买家和卖家，无单个参与者能影响价格',
      domain: '经济学',
      mastery: 40,
    },
    {
      id: 'k5',
      noteId: '1',
      name: '垄断市场',
      description: '单一卖方控制整个市场供给',
      domain: '经济学',
      mastery: 35,
    },
    {
      id: 'k6',
      noteId: '1',
      name: '机会成本',
      description: '为了得到某物而放弃的最高价值替代物',
      domain: '经济学',
      mastery: 60,
    },
    {
      id: 'k7',
      noteId: '1',
      name: '生产可能性边界',
      description: '在资源和技术约束下，经济能生产的最大产出组合',
      domain: '经济学',
      mastery: 50,
    },
    {
      id: 'k8',
      noteId: '1',
      name: '比较优势',
      description: '以更低机会成本生产某产品的能力',
      domain: '经济学',
      mastery: 65,
    },
  ],
  createdAt: '2026-06-23T10:00:00Z',
};

export function NoteDetailPage() {
  const { id } = useParams();
  void id; // reserved for future API fetch
  const navigate = useNavigate();

  // In real app, fetch by id. Using demo for preview.
  const note = demoNote;

  if (!note) {
    return (
      <EmptyState
        title="笔记未找到"
        description="该笔记不存在或已被删除"
        action={
          <button
            onClick={() => navigate('/notes')}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
          >
            返回笔记列表
          </button>
        }
      />
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold">{note.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[13px] text-text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(note.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {note.contentType.toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              {note.tags.join('、')}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {note.status === 'completed' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <CheckCircle className="h-3 w-3" /> AI 分析完成
            </span>
          )}
        </div>
      </div>

      {/* AI Summary */}
      {note.aiSummary && (
        <div className="mb-6 rounded-2xl border border-border/60 bg-slate-50 p-5">
          <h4 className="mb-2 text-sm font-semibold text-text-secondary">AI 摘要</h4>
          <p className="text-sm leading-relaxed text-text-secondary">{note.aiSummary}</p>
        </div>
      )}

      {/* Knowledge Points */}
      <div className="mb-6">
        <h4 className="mb-4 text-sm font-semibold text-text-secondary">
          AI 提取知识点（{note.knowledgePoints.length} 个）
        </h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {note.knowledgePoints.map((kp) => (
            <KnowledgePointCard key={kp.id} kp={kp} />
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-8 flex flex-wrap gap-2">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate('/review')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
        >
          <Play className="h-4 w-4" /> 开始复习这篇笔记
        </button>
        <button
          onClick={() => navigate('/notes')}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-card px-5 py-2.5 text-sm font-semibold text-text-secondary transition-all duration-300 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" /> 删除笔记
        </button>
      </div>
    </div>
  );
}
