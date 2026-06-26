import { FileQuestion } from 'lucide-react';

interface Props {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon || <FileQuestion className="mb-4 h-12 w-12 text-text-muted" />}
      <h4 className="mb-1.5 text-lg font-semibold">{title}</h4>
      {description && <p className="mb-5 max-w-sm text-sm text-text-muted">{description}</p>}
      {action}
    </div>
  );
}
