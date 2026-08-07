const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 h-32" />
    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-4 h-24" />
      ))}
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
      <div className="rounded-3xl border border-zinc-200 bg-white h-64" />
      <div className="rounded-3xl border border-zinc-200 bg-white h-64" />
    </div>
  </div>
);

export default DashboardSkeleton;
