import { Heart, Eye, ChevronDown, Mail, Key } from 'lucide-react';

const ProjectHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-8 border-b border-border">
      {/* Left: Project Info */}
      <div className="flex items-center gap-4">
        {/* Project Logo/Avatar */}
        <div className="h-16 w-16 bg-[#D89B99] rounded flex items-center justify-center shrink-0">
          <div className="grid grid-cols-4 grid-rows-4 gap-0.5 w-8 h-8 opacity-50 mix-blend-overlay">
             {/* Pixel art placeholder */}
             {[...Array(16)].map((_, i) => <div key={i} className="bg-white rounded-sm" />)}
          </div>
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-accent">Firenze Haccp</h1>
            <Key size={18} className="text-text/50" />
          </div>
          <p className="text-text/80 font-medium mt-1">Survey Portal</p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-accent-bg/50 border border-border rounded-md overflow-hidden">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium hover:bg-border transition-colors">
            <Heart size={16} /> Like
          </button>
          <div className="px-3 py-1.5 border-l border-border text-sm font-medium bg-bg">0</div>
        </div>

        <div className="flex items-center bg-accent border border-accent rounded-md overflow-hidden text-bg">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity">
            <Eye size={16} /> Watching <ChevronDown size={14} />
          </button>
          <div className="px-3 py-1.5 border-l border-bg/20 text-sm font-medium bg-accent-bg/20 text-accent-bg">4</div>
        </div>

        <button className="p-2 border border-border bg-accent-bg/50 hover:bg-border rounded-md transition-colors">
          <Mail size={16} className="text-text/70" />
        </button>
      </div>
    </div>
  );
};

export default ProjectHeader;