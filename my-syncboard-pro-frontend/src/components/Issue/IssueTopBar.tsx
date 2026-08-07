import { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface FilterGroup {
    label: string;
    options: string[];
}

interface Props {
    groups: FilterGroup[];
    selected: Record<string, string[]>;
    onToggleOption: (group: string, opt: string) => void;
    onClearGroup: (group: string) => void;
    onClearAll: () => void;
    search: string;
    onSearchChange: (val: string) => void;
}

const formatLabel = (val: string) => val.replace('-', ' ');

// Ek single filter dropdown (Type / Priority / Status / etc.)
const FilterDropdown = ({
    group,
    selectedValues,
    onToggleOption,
    onClearGroup,
}: {
    group: FilterGroup;
    selectedValues: string[];
    onToggleOption: (opt: string) => void;
    onClearGroup: () => void;
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const count = selectedValues.length;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    if (group.options.length === 0) return null;

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((p) => !p)}
                className={`inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md border transition-colors duration-200 ${count > 0
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
            >
                {group.label}
                {count > 0 && (
                    <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">
                        {count}
                    </span>
                )}
                <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute  left-0 top-full mt-1.5 z-50 w-48 border border-slate-200 bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {group.label}
                        </span>
                        {count > 0 && (
                            <button
                                onClick={onClearGroup}
                                className="text-[10px] font-medium text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="py-1 max-h-56 overflow-y-auto">
                        {group.options.map((opt) => {
                            const checked = selectedValues.includes(opt);
                            return (
                                <button
                                    key={opt}
                                    onClick={() => onToggleOption(opt)}
                                    className="w-full cursor-pointer flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors"
                                >
                                    <div
                                        className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-all ${checked ? 'bg-slate-900 border-slate-900' : 'border-slate-300 bg-white'
                                            }`}
                                    >
                                        {checked && <Check size={9} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <span className="capitalize text-slate-700 truncate">{formatLabel(opt)}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const IssueTopBar = ({
    groups,
    selected,
    onToggleOption,
    onClearGroup,
    onClearAll,
    search,
    onSearchChange,
}: Props) => {
    const totalSelected = Object.values(selected).flat().length;

    return (
        <div className="flex justify-between items-center gap-2.5  p-2.5 bg-bg">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search by title or reference..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-bg border border-border rounded-md py-2 pl-9 pr-3 text-sm text-text placeholder-text/40 focus:outline-none focus:border-accent transition-colors"
                />
            </div>

            {/* <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" /> */}
            <div className='flex justify-between items-center gap-2.5  p-2.5 bg-bg'>

                {/* Filter dropdowns — Type, Severity, Priority, Status, Assigned to */}
                {groups.map((group) => (
                    <FilterDropdown
                        key={group.label}
                        group={group}
                        selectedValues={selected[group.label] ?? []}
                        onToggleOption={(opt) => onToggleOption(group.label, opt)}
                        onClearGroup={() => onClearGroup(group.label)}
                    />
                ))}

                {totalSelected > 0 && (
                    <button
                        onClick={onClearAll}
                        className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors px-2 py-2"
                    >
                        <X size={13} />
                        Clear all ({totalSelected})
                    </button>
                )}
            </div>

        </div>
    );
};

export default IssueTopBar;