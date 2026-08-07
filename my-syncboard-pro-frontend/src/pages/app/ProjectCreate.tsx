import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectDetailsStep from '../../components/ProjectDetailsStep.tsx';
import AddMembersStep from '../../components/AddMembersStep.tsx';
import { useAppDispatch } from '../../hooks/storeHooks.ts';
import { setAuthFailure } from '../../features/auth/authSlice.ts';
import axiosInstance from '../../api/axiosInstance.ts';

export interface ProjectFormData {
  name: string;
  description: string;
  memberIds: string[];
}

const ProjectCreate = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    memberIds: [],
  });
  const [error, setError] = useState('');

  const goNext = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      setError('Project name and description are required.');
      return;
    }
    setError('');
    setStep(2);
  };

  const goBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep(1);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/project/create", formData);
      console.log("response", response);
      navigate('/projects');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Authentication failed. Please try again.';
      dispatch(setAuthFailure(errorMessage));
    }
  };

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden bg-white text-zinc-900 flex flex-col items-center justify-start p-6 pt-12 md:pt-16">
      <div className="w-full max-w-xl">
        {/* ---------- Header ---------- */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-zinc-800 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M3 9h18" />
            </svg>
          </div>
          <h1 className="text-zinc-950 font-semibold text-2xl mb-1.5">New project</h1>
          <p className="text-slate-500 text-sm">
            {step === 1
              ? 'Give your project a name your team will recognize.'
              : 'Add the people who will be working on this.'}
          </p>
        </div>

        {/* ---------- Step indicator ---------- */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-zinc-800' : 'bg-slate-100'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-zinc-800' : 'bg-slate-100'}`} />
        </div>
        <p className="font-mono text-xs text-slate-500 uppercase tracking-wide mb-6">
          Step {step} of 2 — {step === 1 ? 'Project details' : 'Add members'}
        </p>

        {/* ---------- Card ---------- */}
        {/* ✅ Change: Removed overflow-y-auto from here so the card container stays fixed */}
        <div className="border border-slate-200 rounded-lg p-6 bg-white shadow-sm h-[390px]">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 mb-5 font-medium">
              {error}
            </div>
          )}

          {step === 1 ? (
            <ProjectDetailsStep formData={formData} setFormData={setFormData} />
          ) : (
            <AddMembersStep formData={formData} setFormData={setFormData} />
          )}
        </div>

        {/* ---------- Footer actions ---------- */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={goBack}
            className="flex-1 border border-slate-200 text-zinc-800 bg-white font-medium text-sm py-3 rounded-md hover:bg-slate-50 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={step === 1 ? goNext : handleCreate}
            className="flex-1 bg-zinc-900 text-white font-medium text-sm py-3 rounded-md hover:bg-zinc-800 transition-colors"
          >
            {step === 1 ? 'Continue' : 'Create project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCreate;