import { FileText, Calendar, Lightbulb, CheckCircle } from 'lucide-react';
import type { Note } from '@/types';
import { formatDate } from '@/utils/formatDate';

interface Props {
  note: Note;
  onClick?: () => void;
}

const contentTypeIcon: Record<string, string> = {
  pdf: 'PDF',
  docx: 'Word',
  text: '文字',
};

const contentTypeColor: Record<string, string> = {
  pdf: 'from-primary to-primary-light',
  docx: 'from-secondary to-secondary-light',
  text: 'from-accent to-purple-300',
};

export function NoteCard({ note, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border border-border/60 bg-bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg"
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br ${contentTypeColor[note.contentType] || 'from-primary to-primary-light'} text-white`}
      >
        <FileText className="h-4 w-4" />
      </div>
      <h4 className="mb-1.5 text-[15px] font-semibold leading-snug line-clamp-2">{note.title}</h4>
      <div className="flex items-center gap-3 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(note.createdAt)}
        </span>
        <span>{contentTypeIcon[note.contentType] || note.contentType}</span>
      </div>
      {(() => {
        const tags = Array.isArray(note.tags) ? note.tags : [];
        return tags.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-text-secondary">
                {tag}
              </span>
            ))}
          </div>
        ) : null;
      })()}
      <div className="mt-2 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs text-text-muted">
          <Lightbulb className="h-3 w-3" />
          {note.knowledgePoints?.length || 0} 个知识点
        </span>
        {note.status === 'completed' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
            <CheckCircle className="h-3 w-3" /> AI 已分析
          </span>
        ) : note.status === 'analyzing' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
            分析中
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
            失败
          </span>
        )}
      </div>
    </div>
  );
}
