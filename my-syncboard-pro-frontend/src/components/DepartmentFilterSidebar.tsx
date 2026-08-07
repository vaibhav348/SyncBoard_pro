import { DEPARTMENT_GROUPS, type DepartmentOption } from '../config/departments';

interface Props {
  activeDepartment: DepartmentOption | 'ALL';
  onSelectDepartment: (dept: DepartmentOption | 'ALL') => void;
}

const DepartmentFilterSidebar = ({ activeDepartment, onSelectDepartment }: Props) => {
  return (
    <div className="space-y-4">
      <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-900 px-1">
        Department
      </p>

      {/* All */}
      <button
        onClick={() => onSelectDepartment('ALL')}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
          activeDepartment === 'ALL'
            ? 'bg-slate-900 text-white font-medium'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        All departments
        {activeDepartment === 'ALL' && (
          <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
        )}
      </button>

      {/* Grouped sections */}
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {DEPARTMENT_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 pl-1 pr-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.options.map((dept) => {
                const isActive = activeDepartment === dept;
                return (
                  <button
                    key={dept}
                    onClick={() => onSelectDepartment(dept)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors duration-200 ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <span className="truncate text-left">{dept}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentFilterSidebar;