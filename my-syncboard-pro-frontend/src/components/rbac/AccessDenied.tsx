const AccessDenied = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
    <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-500">Access denied</p>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">You do not have permission to view this page.</h1>
      <p className="mt-3 text-sm text-slate-600">Please contact an owner or manager if you believe this is a mistake.</p>
    </div>
  </div>
);

export default AccessDenied;
