import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

const EmptyState = ({ icon, title, description, actionLabel, actionTo }: Props) => (
  <div className="flex flex-col items-center text-center py-10 px-4">
    <div className="w-10 h-10 rounded-md bg-accent-bg border border-border flex items-center justify-center mb-4 text-accent">
      {icon}
    </div>
    <h3 className="text-text-h font-semibold text-sm mb-1.5">{title}</h3>
    <p className="text-text/60 text-sm max-w-xs mb-5">{description}</p>
    {actionLabel && actionTo && (
      <Link
        to={actionTo}
        className="text-sm font-medium bg-accent text-bg px-4 py-2.5 rounded-md hover:opacity-85 transition-opacity"
      >
        {actionLabel}
      </Link>
    )}
  </div>
);

export default EmptyState;