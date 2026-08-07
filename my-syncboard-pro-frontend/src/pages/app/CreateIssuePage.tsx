import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, AlertCircle, Loader2, Paperclip, CheckCircle2 } from 'lucide-react';
import { useAppSelector } from '../../hooks/storeHooks';
import axiosInstance from '../../api/axiosInstance';
interface CreateIssuePageProps {
  onClose: () => void;
  setIssues: React.Dispatch<React.SetStateAction<any[]>>;
  issues:any[];
  // taskId:any;
  sprintId?: string | null; 
}

// Backend updated Zod schema ke sath synced interface
interface IssueForm {
  title: string;          
  description: string;
  priority: 'Low' | 'Medium' | 'High';                
  type: 'Bug' | 'Feature' | 'Issue';                   // Added field
  severity: 'Low' | 'Normal' | 'High' | 'Critical';   // Added field
  assignedTo: string;  
  sprintId: string;
  
   
}

// Keep these in sync with the backend Zod limits (title 150 / description 3000)
const LIMITS = {
  TITLE_MAX: 150,
  DESC_MAX: 3000,
};

const CreateIssuePage = ({ onClose, setIssues, sprintId }: CreateIssuePageProps) => {
  const { projectId } = useParams<{ projectId: string }>();
  
  const { data: projectData } = useAppSelector((state) => state.activeProject);
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const activeSprint = useAppSelector((s) => s.scrum.activeSprint);
  const resolvedSprintId = sprintId || activeSprint?._id || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successSubject, setSuccessSubject] = useState<string | null>(null);
  
  // Status removed, defaults added for type and severity
  const [form, setForm] = useState<IssueForm>({
    title: '',
    description: '',
    priority: 'Medium',    
    type: 'Bug',          
    severity: 'Normal',    
    assignedTo: '',
    sprintId:resolvedSprintId
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectBox = (name: keyof IssueForm, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend validations matching your Zod schema
    if (!form.title.trim()) return setError('Title is required.');
    if (form.title.trim().length < 2) return setError('Title should be at least 2 characters long.');
    if (form.title.trim().length > LIMITS.TITLE_MAX) return setError(`Title cannot exceed ${LIMITS.TITLE_MAX} characters.`);
    if (form.description.trim().length < 10) return setError('Description should be at least 10 characters long.');
    if (form.description.trim().length > LIMITS.DESC_MAX) return setError(`Description cannot exceed ${LIMITS.DESC_MAX} characters.`);
    if (!projectId) return setError('ProjectId is mandatory.');
    if (!form.assignedTo) return setError("Please assign the issue to someone.");
    
    setLoading(true);
    setError('');

    try {
      const apiPayload = {
        ...form,
        projectId: projectId,
        assignedTo: form.assignedTo || undefined,
        sprintId: resolvedSprintId || undefined, 
      };

      const response = await axiosInstance.post(`/issue/create`, apiPayload);
      console.log("response", response);
      const newCreatedIssue = response.data?.issue || response.data?.issueData || response.data;
      console.log("newCreatedIssue", newCreatedIssue)
      if (newCreatedIssue && typeof setIssues === 'function') {
        // Prepend logic allows immediate display on the top row of IssueTable
        setIssues((prevIssues) => [newCreatedIssue, ...prevIssues]);
      }
      setSuccessSubject(form.title);

      setTimeout(() => {
        setSuccessSubject(null);
        setLoading(false);
        onClose(); 
      }, 2000);

    } catch (err: any) {
      const backendErrors = err?.response?.data?.errors;
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        setError(backendErrors[0].message);
      } else {
        setError(err?.response?.data?.message || 'Failed to create the issue.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Layout */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Create Issue</h1>
            <p className="text-xs text-slate-500 mt-0.5">File and track a new issue in this workspace.</p>
          </div>
          <button 
            type="button"
            onClick={loading ? () => {} : onClose} 
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 border border-slate-200 rounded-xl disabled:opacity-40 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Dynamic Content Body */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          
          {/* ── CASE 1: Success Banner State ── */}
          {successSubject ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-200">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-base font-semibold text-slate-900 truncate max-w-md px-2">
                "{successSubject}"
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Issue created and published successfully.
              </p>
            </div>
          ) : (

            /* ── CASE 2: Standard Form Grid ── */
            <>
              {error && (
                <div className="mx-6 mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                
                {/* Left Column: Primary Text Fields */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Issue Title</label>
                    <input 
                      type="text"
                      name="title" 
                      value={form.title}
                      maxLength={LIMITS.TITLE_MAX}
                      onChange={handleChange}
                      placeholder="What needs attention?"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Description</label>
                    <textarea 
                      name="description"
                      value={form.description}
                      maxLength={LIMITS.DESC_MAX}
                      onChange={handleChange}
                      placeholder="Provide details or reproduction steps (min 10 characters)..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:bg-white focus:outline-none transition-all placeholder:text-slate-400 resize-none min-h-[160px]"
                      required
                    />
                  </div>

                  <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-xl p-3 text-center hover:bg-slate-100 transition-all cursor-pointer group">
                    <label htmlFor="file-drop" className="cursor-pointer flex items-center justify-center gap-2 text-xs font-medium text-slate-500 group-hover:text-slate-700">
                      <Paperclip size={14} className="text-slate-400" />
                      <span>Attach assets or documents</span>
                    </label>
                    <input type="file" className="hidden" id="file-drop" multiple />
                  </div>
                </div>

                {/* Right Column: Attribute Selectors */}
                <div className="space-y-5 lg:border-l lg:border-slate-100 lg:pl-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    
                    {/* Assignee Box */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Assignee</label>
                        {form.assignedTo !== currentUserId && (
                          <button 
                            type="button" 
                            onClick={() => handleSelectBox('assignedTo', currentUserId || '')}
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"   
                          >
                            Assign to me
                          </button>
                        )}
                      </div>
                      <select 
                        name="assignedTo"
                        value={form.assignedTo}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 font-semibold focus:outline-none focus:border-slate-400 capitalize transition-all cursor-pointer"
                      >
                        <option value="" className="bg-white text-slate-400">Unassigned</option>
                        {projectData?.members?.map((member) => (
                          <option key={member._id} value={member._id} className="bg-white text-slate-700">
                            {member.name} {member._id === currentUserId ? '(You)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type Box */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Type</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Bug', 'Feature', 'Issue'] as const).map((t) => {
                          const isSelected = form.type === t;
                          let selectedStyle = 'bg-slate-800 text-white border-slate-800';
                          if (t === 'Bug' && isSelected) selectedStyle = 'bg-red-50 text-red-600 border-red-200 ring-1 ring-red-100';
                          if (t === 'Feature' && isSelected) selectedStyle = 'bg-purple-50 text-purple-600 border-purple-200 ring-1 ring-purple-100';
                          if (t === 'Issue' && isSelected) selectedStyle = 'bg-blue-50 text-blue-600 border-blue-200 ring-1 ring-blue-100';

                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleSelectBox('type', t)}
                              className={`py-1.5 px-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                                isSelected ? selectedStyle : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {t === 'Bug' ? 'Bug' : t === 'Feature' ? 'Feat' : 'Issue'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Severity Box */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Severity</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(['Low', 'Normal', 'High', 'Critical'] as const).map((sev) => {
                          const isSelected = form.severity === sev;
                          let activeStyle = '';
                          if (sev === 'Low') activeStyle = 'bg-slate-200 text-slate-800 border-slate-300';
                          if (sev === 'Normal') activeStyle = 'bg-sky-50 text-sky-600 border-sky-200';
                          if (sev === 'High') activeStyle = 'bg-orange-50 text-orange-600 border-orange-200';
                          if (sev === 'Critical') activeStyle = 'bg-rose-50 text-rose-600 border-rose-200 ring-1 ring-rose-100';

                          return (
                            <button
                              key={sev}
                              type="button"
                              onClick={() => handleSelectBox('severity', sev)}
                              className={`py-1.5 text-[11px] font-semibold rounded-xl border transition-all cursor-pointer ${
                                isSelected ? `${activeStyle} font-bold` : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {sev === 'Critical' ? 'Crit' : sev}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Priority Box */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Priority</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Low', 'Medium', 'High'] as const).map((p) => {
                          const isSelected = form.priority === p;
                          let activeStyle = '';
                          if (p === 'Low') activeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200';
                          if (p === 'Medium') activeStyle = 'bg-amber-50 text-amber-600 border-amber-200';
                          if (p === 'High') activeStyle = 'bg-red-50 text-red-600 border-red-200';

                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => handleSelectBox('priority', p)}
                              className={`py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                                isSelected ? `${activeStyle} font-bold` : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Action Row */}
                  <div className="pt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="w-1/3 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin text-white" size={14} />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <span>Create Issue</span>
                      )}
                    </button>
                  </div>

                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateIssuePage;