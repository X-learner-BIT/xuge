import { Lightbulb } from 'lucide-react';
import type { KnowledgePoint } from '@/types';

interface Props {
  kp: KnowledgePoint;
}

export function KnowledgePointCard({ kp }: Props) {
  return (
    <div className="flex items-start gap-3 rounded-xl border-l-[3px] border-primary-light bg-slate-50 p-4 transition-all duration-300 hover:bg-slate-100">
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Lightbulb className="h-3 w-3" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{kp.name}</div>
        {kp.description && (
          <div className="mt-0.5 text-[13px] text-text-secondary">{kp.description}</div>
        )}
        {kp.domain && (
          <div className="mt-1.5 inline-block rounded-md bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
            {kp.domain}
          </div>
        )}
      </div>
    </div>
  );
}
