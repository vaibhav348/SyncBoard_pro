const shimmer = 'animate-pulse rounded-2xl border border-slate-200/80 bg-white';

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className={`${shimmer} h-36 rounded-3xl`} />

    <div className="grid gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`${shimmer} h-28`} />
      ))}
    </div>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
      <div className="space-y-6">
        <div className={`${shimmer} h-72 rounded-3xl`} />
        <div className={`${shimmer} h-56 rounded-3xl`} />
      </div>
      <div className="space-y-6">
        <div className={`${shimmer} h-40 rounded-3xl`} />
        <div className={`${shimmer} h-80 rounded-3xl`} />
      </div>
    </div>
  </div>
);

export default DashboardSkeleton;