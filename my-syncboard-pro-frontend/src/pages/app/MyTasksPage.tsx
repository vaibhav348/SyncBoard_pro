const issues = [
  { id: 'SYN-101', title: 'Recalibrate layout response parameters', status: 'In progress' },
  { id: 'SYN-94', title: 'Deploy local storage wrapper', status: 'To do' },
  { id: 'MKT-22', title: 'Update pricing copy', status: 'Done' },
];

const MyIssuesPage = () => {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-bg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-text-h">My tasks</h1>
        <p className="mt-2 text-sm text-text/70">Your personal work queue and current progress.</p>
      </section>

      <section className="rounded-3xl border border-border bg-bg p-5 shadow-sm">
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="flex items-center justify-between rounded-2xl border border-border bg-accent-bg/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-text-h">{issue.title}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-text/50">{issue.id}</p>
              </div>
              <span className="rounded-full border border-border bg-bg px-2.5 py-1 text-xs font-medium text-text/70">
                {issue.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MyIssuesPage;
