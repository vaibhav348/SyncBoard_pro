import { Star } from 'lucide-react';

const teamMembers = [
  { id: 1, avatar: 'https://i.pravatar.cc/150?u=lov', isOwner: true },
  { id: 2, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=2', bg: 'bg-purple-200' },
  { id: 3, avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=3', bg: 'bg-red-200' },
  { id: 4, avatar: 'https://i.pravatar.cc/150?u=4', isOwner: false },
];

const TeamSidebar = () => {
  return (
    <div className="w-full lg:w-72 shrink-0">
      <div className="bg-accent-bg/30 border border-border rounded-lg overflow-hidden">
        <div className="bg-accent-bg/50 px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-text-h text-sm">Team</h3>
        </div>
        <div className="p-4 flex flex-wrap gap-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="relative">
              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 border-bg shadow-sm ${member.bg || ''}`}>
                <img src={member.avatar} alt="Team member" className="w-full h-full object-cover" />
              </div>
              {member.isOwner && (
                <div className="absolute -bottom-1 -right-1 bg-accent text-bg p-0.5 rounded-full border-2 border-bg">
                  <Star size={10} fill="currentColor" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamSidebar;