// ResultSection.tsx
// Renders one grouped block of results (Tasks / Sprints / Stories / Team)
// with the search term highlighted inside each result's title.

import type { LucideIcon } from "lucide-react";
import type { SearchItem } from "../../types/search.types";

interface ResultSectionProps<T extends SearchItem> {
  title: string;
  items: T[];
  icon: LucideIcon;
  query: string;
  onItemClick: (item: T) => void;
}

// Wraps the substring of `text` that matches `query` in <mark>.
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-inherit rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function ResultSection<T extends SearchItem>({
  title,
  items,
  icon: Icon,
  query,
  onItemClick,
}: ResultSectionProps<T>) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
        {title} <span className="text-gray-300">({items.length})</span>
      </h3>

      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item._id}
            onClick={() => onItemClick(item)}
            className="w-full flex items-center gap-3 rounded-lg p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
              <Icon size={16} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                <HighlightedText text={item.primaryText} query={query} />
              </p>
              {item.secondaryText && (
                <p className="truncate text-xs text-gray-500">{item.secondaryText}</p>
              )}
            </div>

            {item.status && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {item.status}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}