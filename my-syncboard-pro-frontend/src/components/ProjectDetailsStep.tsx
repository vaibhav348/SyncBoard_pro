import type { ProjectFormData } from '../pages/app/ProjectCreate';

interface Props {
  formData: ProjectFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProjectFormData>>;
}

const ProjectDetailsStep = ({ formData, setFormData }: Props) => {
  return (
    <div className="space-y-5 pb-2">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Project name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          className="w-full rounded-md bg-white border border-slate-200 p-3 text-sm text-zinc-900 placeholder-slate-400 focus:outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-shadow"
          placeholder="Mobile App Redesign"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          rows={5}
          className="w-full rounded-md bg-white border border-slate-200 p-3 text-sm text-zinc-900 placeholder-slate-400 focus:outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-shadow resize-none"
          placeholder="What is this project about?"
        />
      </div>
    </div>
  );
};

export default ProjectDetailsStep;