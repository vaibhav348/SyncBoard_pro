export const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
    <div className="flex gap-2 justify-center items-center min-w-[80px]">
      <span className="text-2xl font-semibold text-zinc-900 leading-none">{value}</span>
      <div className="flex flex-col">
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 mt-0.5">{label}</span>
        {sub && <span className="text-[10px] text-zinc-600 mt-0.3">{sub}</span>}
      </div>
    </div>
  );
  