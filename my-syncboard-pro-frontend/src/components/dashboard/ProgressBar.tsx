interface Props {
  value: number; // 0-100
  label?: string;
}

const ProgressBar = ({ value, label }: Props) => {
  const clamped = Math.min(100, Math.max(0, value));
  const isHigh = clamped >= 80;

  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-text/50">{label}</span>
          <span className="font-mono text-xs text-text/60">{clamped}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-border/70">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? 'bg-gradient-to-r from-accent to-accent/70' : 'bg-text/40'}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;