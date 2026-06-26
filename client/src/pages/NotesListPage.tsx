import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { NoteCard } from '@/components/NoteCard';
import { EmptyState } from '@/components/EmptyState';
import { useNotes } from '@/hooks/useNotes';
import type { Note } from '@/types';

// Demo data for visual preview
const demoNotes: Note[] = [
  {
    id: '1',
    title: '微观经济学原理',
    contentType: 'pdf',
    aiSummary: '本文介绍了微观经济学的基本概念...',
    tags: ['经济学', '微观'],
    status: 'completed',
    knowledgePoints: Array.from({ length: 8 }),
    createdAt: '2026-06-23T10:00:00Z',
  },
  {
    id: '2',
    title: '数据结构与算法',
    contentType: 'docx',
    aiSummary: null,
    tags: ['计算机', '算法'],
    status: 'completed',
    knowledgePoints: Array.from({ length: 12 }),
    createdAt: '2026-06-22T10:00:00Z',
  },
  {
    id: '3',
    title: '管理学基础',
    contentType: 'text',
    aiSummary: null,
    tags: ['管理学', '商科'],
    status: 'completed',
    knowledgePoints: Array.from({ length: 6 }),
    createdAt: '2026-06-20T10:00:00Z',
  },
  {
    id: '4',
    title: '数据库系统概论',
    contentType: 'pdf',
    aiSummary: null,
    tags: ['数据库', '计算机'],
    status: 'completed',
    knowledgePoints: Array.from({ length: 10 }),
    createdAt: '2026-06-18T10:00:00Z',
  },
  {
    id: '5',
    title: '人工智能导论',
    contentType: 'pdf',
    aiSummary: null,
    tags: ['AI', '计算机'],
    status: 'completed',
    knowledgePoints: Array.from({ length: 15 }),
    createdAt: '2026-06-15T10:00:00Z',
  },
];

export function NotesListPage() {
  const navigate = useNavigate();
  const { notes } = useNotes();
  const [search, setSearch] = useState('');

  const displayNotes = notes.length > 0 ? notes : demoNotes;
  const filtered = displayNotes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-border bg-bg-card px-3 py-2">
            <LayoutGrid className="h-4 w-4 text-text-muted" />
            <span className="ml-2 text-sm font-medium">卡片</span>
          </div>
          <button className="flex items-center rounded-xl border border-border bg-bg-card px-3 py-2 text-sm text-text-secondary transition-all hover:border-primary-light hover:text-primary">
            <ListIcon className="h-4 w-4" />
            <span className="ml-2">列表</span>
          </button>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-4 py-2 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
        >
          <Plus className="h-4 w-4" /> 新建笔记
        </button>
      </div>

      {/* Search */}
      <div className="mb-5 flex items-center rounded-xl border border-border bg-bg-card px-4 py-2.5 transition-all focus-within:border-primary-light focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]">
        <Search className="h-4 w-4 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索笔记标题、标签..."
          className="ml-3 flex-1 border-none bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
        />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => navigate(`/note/${note.id}`)}
            />
          ))}
          {/* Upload placeholder card */}
          <div
            onClick={() => navigate('/upload')}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card p-5 text-center transition-all duration-300 hover:border-primary-light hover:bg-primary/[0.02]"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary to-primary-light text-white">
              <Plus className="h-4 w-4" />
            </div>
            <div className="text-[15px] font-semibold text-text-secondary">上传新笔记…</div>
            <p className="mt-1 text-xs text-text-muted">点击或拖拽上传</p>
            <p className="mt-2 text-xs text-text-muted">支持 PDF / Word / 文字</p>
          </div>
        </div>
      ) : (
        <EmptyState
          title="还没有笔记"
          description="先去上传一篇笔记，让 AI 帮你提取知识点吧"
          action={
            <button
              onClick={() => navigate('/upload')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary-hover"
            >
              <Plus className="h-4 w-4" /> 上传笔记
            </button>
          }
        />
      )}
    </div>
  );
}
