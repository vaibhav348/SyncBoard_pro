import { Briefcase, ChevronLeft, ChevronRight, List, Save, SquareX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/storeHooks';
import { useActiveIssue } from '../../hooks/useActiveIssue';
import { useCanEditIssue } from '../../hooks/useCanEditIssue';
import { useIssueFieldUpdate } from '../../hooks/useIssueFieldUpdate';

const getInitials = (name?: string) =>
  (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export const IssueHeader = () => {
  const [titleEdit, setTitleEdit] = useState(false);
  const [localTitle, setLocalTitle] = useState('');
  const activeProject = useAppSelector((state) => state.activeProject);
  const sprints = useAppSelector((state) => state.scrum.sprints);
  const { issue } = useActiveIssue();
  const canEditAll = useCanEditIssue();
  const updateField = useIssueFieldUpdate();

  useEffect(() => {
    if (issue?.title) {
      setLocalTitle(issue.title);
    }
  }, [issue?.title]);

  const handleSave = () => {
    if (titleHasError) return;
    void updateField('title', localTitle.trim());
    setTitleEdit(false);
  };
  const TITLE_MIN = 3;
  const TITLE_MAX = 150;
  const titleLength = localTitle.trim().length;
  const isTitleTooShort = titleLength > 0 && titleLength < TITLE_MIN;
  const isTitleTooLong = titleLength > TITLE_MAX;
  const isTitleEmpty = titleLength === 0;
  const titleHasError = isTitleEmpty || isTitleTooShort || isTitleTooLong;

  const titleErrorMessage = isTitleEmpty
    ? 'Title cannot be empty.'
    : isTitleTooShort
      ? `Title must be at least ${TITLE_MIN} characters.`
      : isTitleTooLong
        ? `Title is too long (${titleLength}/${TITLE_MAX} characters).`
        : null;

  if (!issue) return null;

  const sprintIdStr =
    typeof (issue as any)?.sprintId === 'object'
      ? (issue as any).sprintId?._id
      : (issue as any)?.sprintId;

  const projectId = activeProject?.data?._id;
  const parentSprint = (sprints as Array<{ _id?: string; name?: string }> | undefined)?.find(
    (sprint) => sprint._id === sprintIdStr
  );

  return (
    <div className="border-b border-slate-200 bg-white py-6 px-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">

          <div className="flex items-center gap-2 mb-2">
            <Link
              to={`/projects/${projectId}/issues`}
              relative="path"
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors shrink-0"
            >
              <List size={14} />
              List of issues
            </Link>

            {sprintIdStr && parentSprint &&
              <div className='w-0.5 h-4 bg-slate-400 shrink-0'></div>
            }

            {sprintIdStr && parentSprint &&
              <Link
                to={`/projects/${projectId}/board?sprintId=${sprintIdStr}`}
                relative="path"
                className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors shrink-0"
              >
                <Briefcase size={14} />
                Go to sprint
              </Link>
            }
          </div>

          {titleEdit && canEditAll ? (
            <div className="w-full mt-4">
              <div className="flex gap-2 items-start">
                <input
                  disabled={!canEditAll}
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Write a title..."
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && !titleHasError && handleSave()}
                  maxLength={TITLE_MAX + 20}
                  className={`text-xl font-semibold leading-relaxed rounded-md border p-2 cursor-text w-full bg-white focus:outline-none focus:ring-2 transition-colors resize-none text-slate-800 ${titleHasError
                      ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                      : 'border-slate-300 focus:ring-indigo-100 focus:border-indigo-300'
                    }`}
                />
                <div className="flex items-center gap-1 shrink-0 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={titleHasError}
                    title="Save"
                    className="p-2 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setLocalTitle(issue.title || '');
                      setTitleEdit(false);
                    }}
                    title="Cancel"
                    className="p-2 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <SquareX size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1.5 px-0.5 mr-20">
                <span className="text-[11px] text-red-500">{titleErrorMessage}</span>
                <span className={`text-[11px] font-mono shrink-0 ${isTitleTooLong ? 'text-red-500 font-semibold' : 'text-slate-400'
                  }`}>
                  {titleLength}/{TITLE_MAX}
                </span>
              </div>
            </div>
          ) : (
            <h1
              onClick={() => canEditAll && setTitleEdit(true)}
              className={`text-xl font-semibold leading-relaxed rounded-lg text-slate-900 border border-dashed ${canEditAll ? 'border-transparent hover:border-slate-300 cursor-text' : 'border-transparent cursor-default'} p-2 -ml-2 transition-colors max-w-full break-words`}
            >
              <span className="text-xl font-mono text-indigo-700 uppercase tracking-wide font-semibold mr-1">
                #{issue.issueKey || issue._id?.slice(-6).toUpperCase()}
              </span>
              {localTitle}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button className="p-2 rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <button className="p-2 rounded-md border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-end justify-between mt-2 gap-3">

        {parentSprint ? (
          <p className="text-sm text-slate-600 flex items-center gap-1 min-w-0">
            <span className="shrink-0">This issue belongs to</span>
            <Link
              to={`/projects/${projectId}/board?sprintId=${parentSprint._id}`}
              relative="path"
              className="text-indigo-600 hover:underline font-medium truncate"
              title={`#${parentSprint._id?.slice(-4)} ${parentSprint.name}`}
            >
              #{parentSprint._id?.slice(-4)} {parentSprint.name}
            </Link>
          </p>
        ) : (
          <div className='h-10'></div>
        )}

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900 truncate max-w-[160px]">
              {issue.assignedBy?.name || 'Unknown'}
            </p>
            <p className="text-[12px] text-slate-500">
              {issue.createdAt
                ? new Date(issue.createdAt).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : '—'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[15px] font-semibold text-white shrink-0">
            {getInitials(issue.assignedBy?.name)}
          </div>
        </div>
      </div>
    </div>
  );
};