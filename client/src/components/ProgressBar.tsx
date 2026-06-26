interface Props {
  value: number;
  max?: number;
  className?: string;
}

export function ProgressBar({ value, max = 100, className = '' }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-border ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
