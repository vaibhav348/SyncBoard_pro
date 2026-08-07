import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

/* ---------- Tiny inline icon set (no external lib, follows currentColor) ---------- */
const icon = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    {path}
  </svg>
);

const Icons = {
  board: icon(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></>),
  shield: icon(<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />),
  sync: icon(<><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" /><path d="M18 4v4h-4M6 20v-4h4" /></>),
  trail: icon(<><path d="M4 6h16M4 12h16M4 18h10" /></>),
  flow: icon(<><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="12" r="2" /><path d="M6 8v8M8 6h4a4 4 0 0 1 4 4M8 18h4a4 4 0 0 0 4-4" /></>),
  layers: icon(<><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>),
};

const whyUs = [
  {
    old: 'Weeks of setup and configuration before a single issue gets created.',
    new: 'Open a workspace, invite your team, start working — same day.',
  },
  {
    old: 'Pricing and seat tiers designed for thousand-person companies.',
    new: 'Pay only for the people actually using it.',
  },
  {
    old: 'Permissions buried three menus deep, confusing for new hires.',
    new: 'Superadmin, owner, manager, employee — visible from day one.',
  },
];

const features = [
  { icon: Icons.board, title: 'Boards & Sprints', desc: 'Plan in kanban or sprint cycles — switch views without losing context.' },
  { icon: Icons.shield, title: 'Role-based Access', desc: 'Superadmins, owners, managers and employees see exactly what they need.' },
  { icon: Icons.sync, title: 'Real-time Sync', desc: 'Every update reflects instantly across your team — no refresh required.' },
  { icon: Icons.trail, title: 'Activity Trail', desc: 'Every change is logged — know who moved what, and exactly when.' },
  { icon: Icons.flow, title: 'Custom Workflows', desc: 'Define the stages that match how your team actually works.' },
  { icon: Icons.layers, title: 'Workspace Controls', desc: 'Manage multiple teams under one workspace without losing oversight.' },
];

const steps = [
  { n: '01', title: 'Create your workspace', desc: 'Set up your team space in seconds — no sales call required.' },
  { n: '02', title: 'Invite your team', desc: 'Assign roles and get everyone in immediately.' },
  { n: '03', title: 'Start shipping', desc: 'Move work across boards and watch it sync in real time.' },
];

const plans = [
  { name: 'Starter', price: 'Free', desc: 'For small teams getting off the ground.', features: ['Up to 5 members', 'Unlimited boards', 'Basic roles', 'Community support'] },
  { name: 'Team', price: '$9', period: '/user/mo', desc: 'For growing teams that need more control.', features: ['Unlimited members', 'Advanced roles & permissions', 'Activity audit trail', 'Priority support'], highlighted: true },
  { name: 'Enterprise', price: 'Custom', desc: 'For organizations running multiple workspaces.', features: ['Superadmin controls', 'Custom workflows', 'Dedicated support', 'SSO on request'] },
];

export default function HomePage() {
  return (
    <div className="bg-bg text-text">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .fade-up.d2 { animation-delay: 0.15s; opacity: 0; }
      `}</style>

      {/* ---------- Nav ---------- */}
      <header className="flex items-center justify-between px-6 md:px-14 py-5 border-b border-border sticky top-0 bg-bg/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-accent" />
          <span className="font-semibold text-base text-text-h">SyncBoard</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-text/70">
          <a href="#features" className="hover:text-text-h transition-colors">Features</a>
          <a href="#pricing" className="hover:text-text-h transition-colors">Pricing</a>
          <a href="#how" className="hover:text-text-h transition-colors">How it works</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm text-text px-3 py-2 hover:text-text-h transition-colors">
            Sign in
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-accent text-bg px-4 py-2 rounded-md hover:opacity-85 transition-opacity"
          >
            Start free
          </Link>
        </div>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="px-6 md:px-14 pt-24 pb-20 max-w-5xl mx-auto">
        <div className="fade-up">
          <span className="font-mono text-xs text-accent uppercase tracking-wide">
            Project management, without the overhead
          </span>
          <h1 className="text-text-h font-semibold text-[2.6rem] md:text-[4rem] leading-[1.05] mt-5 max-w-3xl">
            Built for teams who decided
            <br />
            heavy tools weren't worth it.
          </h1>
          <p className="text-text/70 mt-6 text-lg leading-relaxed max-w-lg">
            SyncBoard skips the configuration, the admin training, and
            the bloated permission trees. Just boards, clear roles, and
            sync that happens instantly.
          </p>

          <div className="flex flex-wrap gap-3 mt-9">
            <Link
              to="/register"
              className="bg-accent text-bg font-medium px-6 py-3.5 rounded-md hover:opacity-85 transition-opacity"
            >
              Create your workspace
            </Link>
            <Link
              to="/login"
              className="border border-border text-text px-6 py-3.5 rounded-md hover:border-accent transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* ---------- Signature visual: hand-drawn board illustration ---------- */}
        <div className="fade-up d2 mt-16 border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent-bg">
            <span className="font-mono text-xs text-text/60">SPRINT 12 / WORKSPACE BOARD</span>
            <span className="font-mono text-[10px] px-2 py-1 rounded-sm bg-bg border border-border text-accent">
              SYNCED
            </span>
          </div>
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { col: 'Backlog', items: ['Design review', 'Spec API contracts'] },
              { col: 'In Progress', items: ['Auth flow', 'Board drag & drop'] },
              { col: 'Done', items: ['Workspace settings'] },
            ].map((c) => (
              <div key={c.col} className="p-5">
                <p className="font-mono text-xs text-text/60 mb-4 uppercase tracking-wide">{c.col}</p>
                <div className="space-y-2">
                  {c.items.map((it) => (
                    <div key={it} className="text-sm px-3 py-2.5 rounded-md border border-border bg-bg text-text">
                      {it}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Why different ---------- */}
      <section className="px-6 md:px-14 py-20 max-w-5xl mx-auto border-t border-border">
        <h2 className="text-text-h font-semibold text-2xl md:text-3xl mb-2">
          Built different, on purpose.
        </h2>
        <p className="text-text/70 mb-12 max-w-md">
          Most teams don't avoid project tools because they dislike planning.
          They avoid the tools.
        </p>

        <div>
          {whyUs.map((row, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-6 border-t border-border py-6 first:border-t-0">
              <p className="text-text/70 text-sm leading-relaxed">{row.old}</p>
              <p className="text-sm leading-relaxed text-text md:pl-6 md:border-l border-border">
                <span className="font-mono text-[10px] text-accent mr-2">SYNCBOARD</span>
                {row.new}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="px-6 md:px-14 py-20 max-w-5xl mx-auto border-t border-border">
        <span className="font-mono text-xs text-accent uppercase tracking-wide">Features</span>
        <h2 className="text-text-h font-semibold text-2xl md:text-3xl mt-2 mb-12">
          Everything your team actually uses.
        </h2>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-10">
          {features.map((f) => (
            <div key={f.title} className="flex gap-4">
              <div className="w-9 h-9 rounded-md bg-accent-bg border border-border flex items-center justify-center text-accent shrink-0">
                {f.icon}
              </div>
              <div>
                <h3 className="text-text-h font-semibold text-base mb-1.5">{f.title}</h3>
                <p className="text-sm text-text/70 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how" className="px-6 md:px-14 py-20 max-w-5xl mx-auto border-t border-border">
        <h2 className="text-text-h font-semibold text-2xl md:text-3xl mb-12">
          Three steps. No onboarding call.
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="border-t-2 border-accent pt-4">
              <span className="font-mono text-xs text-text/60">{s.n}</span>
              <h3 className="text-text-h font-semibold text-lg mt-2 mb-1.5">{s.title}</h3>
              <p className="text-sm text-text/70 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section id="pricing" className="px-6 md:px-14 py-20 max-w-5xl mx-auto border-t border-border">
        <span className="font-mono text-xs text-accent uppercase tracking-wide">Pricing</span>
        <h2 className="text-text-h font-semibold text-2xl md:text-3xl mt-2 mb-12">
          Pay for your team, not a license tier.
        </h2>
        <div className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {plans.map((p) => (
            <div key={p.name} className="bg-bg p-7">
              {p.highlighted && (
                <span className="font-mono text-[10px] text-accent uppercase tracking-wide">Most picked</span>
              )}
              <h3 className="text-text-h font-semibold text-lg mt-2">{p.name}</h3>
              <p className="text-sm text-text/70 mt-1 mb-5">{p.desc}</p>
              <p className="mb-5">
                <span className="text-text-h text-3xl font-semibold">{p.price}</span>
                {p.period && <span className="text-text/60 text-sm">{p.period}</span>}
              </p>
              <ul className="space-y-2.5 mb-7">
                {p.features.map((f) => (
                  <li key={f} className="text-sm text-text/70 flex gap-2">
                    <span className="text-accent">+</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`block text-center text-sm font-medium px-4 py-3 rounded-md transition-colors ${
                  p.highlighted
                    ? 'bg-accent text-bg hover:opacity-85'
                    : 'border border-border text-text hover:border-accent'
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="px-6 md:px-14 py-24 max-w-3xl mx-auto text-center border-t border-border">
        <h2 className="text-text-h font-semibold text-3xl md:text-5xl leading-tight">
          Stop configuring. Start shipping.
        </h2>
        <Link
          to="/register"
          className="inline-block mt-8 bg-accent text-bg font-medium px-7 py-3.5 rounded-md hover:opacity-85 transition-opacity"
        >
          Create your workspace
        </Link>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="px-6 md:px-14 py-8 border-t border-border text-sm text-text/60 flex justify-between max-w-5xl mx-auto">
        <span>© {new Date().getFullYear()} SyncBoard</span>
        <div className="flex gap-5">
          <Link to="/login" className="hover:text-text-h transition-colors">Sign in</Link>
          <Link to="/register" className="hover:text-text-h transition-colors">Register</Link>
        </div>
      </footer>
    </div>
  );
}