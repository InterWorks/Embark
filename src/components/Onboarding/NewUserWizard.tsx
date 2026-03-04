import { useState, useRef, type ChangeEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../hooks/useTeam';
import { useGamificationContext } from '../../context/GamificationContext';
import { BuildADash } from '../Dashboard/BuildADash';
import type { CharacterClass, DashboardWidgetId } from '../../types';
import { DEFAULT_DASHBOARD_WIDGETS } from '../../types';

const TOTAL_STEPS = 5;

const CLASS_DATA: { id: CharacterClass; icon: string; name: string; tagline: string; bonus: string }[] = [
  { id: 'paladin', icon: '⚔️', name: 'Paladin', tagline: 'The Protector', bonus: 'On-time & blocked task resolutions' },
  { id: 'wizard', icon: '🧙', name: 'Wizard', tagline: 'The Strategist', bonus: 'AI features & automations' },
  { id: 'ranger', icon: '🏹', name: 'Ranger', tagline: 'The Scout', bonus: 'Communications & notes' },
  { id: 'rogue', icon: '🗡️', name: 'Rogue', tagline: 'The Executor', bonus: 'Early completions & graduations' },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-1.5 rounded-full transition-all ${
            i < step ? 'bg-yellow-400' : i === step ? 'bg-yellow-400/50' : 'bg-zinc-700'
          }`}
        />
      ))}
    </div>
  );
}

export function NewUserWizard() {
  const { currentUser, updateUser } = useAuth();
  const { teams, createTeam } = useTeam();
  const { selectClass } = useGamificationContext();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState(currentUser?.username ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser?.avatarUrl);
  const [selectedClass, setSelectedClass] = useState<CharacterClass | undefined>(currentUser?.characterClass);
  const [selectedWidgets, setSelectedWidgets] = useState<DashboardWidgetId[]>(
    currentUser?.dashboardConfig?.visibleWidgets ?? DEFAULT_DASHBOARD_WIDGETS
  );
  const [newTeamName, setNewTeamName] = useState('');
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const initials = displayName
    .split(' ')
    .map(p => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || currentUser.username[0].toUpperCase();

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleJoinTeam = (teamId: string) => {
    updateUser({ teamId });
  };

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    const team = createTeam(newTeamName.trim());
    updateUser({ teamId: team.id });
    setShowNewTeamForm(false);
    setNewTeamName('');
  };

  const handleFinish = () => {
    updateUser({
      displayName,
      phone: phone || undefined,
      avatarUrl,
      characterClass: selectedClass,
      dashboardConfig: { visibleWidgets: selectedWidgets },
      onboardingComplete: true,
    } as Parameters<typeof updateUser>[0]);
    if (selectedClass) selectClass(selectedClass);
    // Confetti burst
    triggerConfetti();
  };

  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 bg-zinc-950/90 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-zinc-900 border-2 border-zinc-700 rounded-[4px] shadow-[6px_6px_0_0_#18181b] p-8">
        <ProgressBar step={step} />

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-400 rounded-[4px] border-4 border-zinc-900 shadow-[4px_4px_0_0_#18181b] mb-6">
              <span className="text-4xl">🚀</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2">Welcome to Embark, {currentUser.username}!</h1>
            <p className="text-zinc-400 mb-8">Let's take a minute to set up your personalized experience.</p>
            <div className="grid grid-cols-2 gap-4 mb-8 text-left">
              {[
                { icon: '👤', title: 'Your Profile', desc: 'Set your avatar and display name' },
                { icon: '👥', title: 'Your Team', desc: 'Join or create a team to collaborate' },
                { icon: '⚔️', title: 'Choose a Class', desc: 'Pick your hero role for XP bonuses' },
                { icon: '📊', title: 'Build Your Dash', desc: 'Pick the widgets you actually need' },
              ].map(f => (
                <div key={f.title} className="flex gap-3 bg-zinc-800 rounded-[4px] border border-zinc-700 p-3">
                  <span className="text-2xl">{f.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{f.title}</p>
                    <p className="text-xs text-zinc-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={next}
              className="bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold px-8 py-3 rounded-[4px] border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:shadow-[1px_1px_0_0_#18181b] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              Let's get you set up →
            </button>
          </div>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Your Profile</h2>
            <p className="text-zinc-400 mb-6 text-sm">How you'll appear to your teammates.</p>

            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-24 rounded-full border-4 border-yellow-400 shadow-[3px_3px_0_0_#18181b] overflow-hidden hover:opacity-90 transition-opacity group"
                title="Click to upload photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-600 to-yellow-500 flex items-center justify-center text-white text-3xl font-black">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">📷 Upload</span>
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-800 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Phone <span className="text-zinc-500 text-xs">(optional)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-zinc-800 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400 transition-colors"
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={back} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
              <button
                onClick={() => { updateUser({ phone: phone || undefined, avatarUrl }); next(); }}
                className="bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold px-6 py-2 rounded-[4px] border-2 border-zinc-900 shadow-[2px_2px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Team */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Join a Team</h2>
            <p className="text-zinc-400 mb-6 text-sm">Collaborate with your colleagues on client onboarding.</p>

            <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
              {teams.length === 0 && !showNewTeamForm && (
                <p className="text-zinc-500 text-sm text-center py-4">No teams yet. Create the first one below.</p>
              )}
              {teams.map(team => (
                <div key={team.id} className="flex items-center justify-between bg-zinc-800 border border-zinc-700 rounded-[4px] px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">{team.name}</p>
                    <p className="text-xs text-zinc-400">{team.members.length} member{team.members.length !== 1 ? 's' : ''}</p>
                  </div>
                  {currentUser.teamId === team.id ? (
                    <span className="text-yellow-400 text-xs font-bold">✓ Joined</span>
                  ) : (
                    <button
                      onClick={() => handleJoinTeam(team.id)}
                      className="text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-zinc-900 px-3 py-1 rounded-[4px] border border-zinc-900 shadow-[1px_1px_0_0_#18181b] transition-all"
                    >
                      Join
                    </button>
                  )}
                </div>
              ))}
            </div>

            {!showNewTeamForm ? (
              <button
                onClick={() => setShowNewTeamForm(true)}
                className="w-full border-2 border-dashed border-zinc-600 hover:border-yellow-400 rounded-[4px] py-3 text-zinc-400 hover:text-yellow-400 text-sm font-medium transition-colors"
              >
                + Create a new team
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  placeholder="Team name"
                  autoFocus
                  className="flex-1 bg-zinc-800 border-2 border-zinc-600 rounded-[4px] px-3 py-2 text-white focus:outline-none focus:border-yellow-400 transition-colors"
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateTeam(); if (e.key === 'Escape') setShowNewTeamForm(false); }}
                />
                <button
                  onClick={handleCreateTeam}
                  className="bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold px-4 py-2 rounded-[4px] border-2 border-zinc-900 shadow-[2px_2px_0_0_#18181b] transition-all"
                >
                  Create
                </button>
                <button onClick={() => setShowNewTeamForm(false)} className="text-zinc-400 hover:text-white px-2 transition-colors">✕</button>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button onClick={back} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
              <div className="flex gap-3">
                <button onClick={next} className="text-zinc-400 hover:text-white text-sm transition-colors">Skip for now</button>
                <button
                  onClick={next}
                  className="bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold px-6 py-2 rounded-[4px] border-2 border-zinc-900 shadow-[2px_2px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Class Picker */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Choose Your Class</h2>
            <p className="text-zinc-400 mb-6 text-sm">Your class determines your XP bonuses and play style.</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {CLASS_DATA.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`relative text-left p-4 rounded-[4px] border-2 transition-all ${
                    selectedClass === cls.id
                      ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_16px_rgba(250,204,21,0.3)]'
                      : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
                  }`}
                >
                  {selectedClass === cls.id && (
                    <span className="absolute top-2 right-2 text-yellow-400 text-xs font-black">✓</span>
                  )}
                  <div className="text-3xl mb-2">{cls.icon}</div>
                  <p className="font-black text-white">{cls.name}</p>
                  <p className="text-xs text-zinc-400 font-medium">{cls.tagline}</p>
                  <p className="text-xs text-zinc-500 mt-1">XP: {cls.bonus}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={back} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
              <button
                onClick={next}
                disabled={!selectedClass}
                className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 font-bold px-6 py-2 rounded-[4px] border-2 border-zinc-900 shadow-[2px_2px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Build-A-Dash */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-black text-white mb-1">Build Your Dashboard</h2>
            <p className="text-zinc-400 mb-4 text-sm">Pick the widgets you want to see. You can change this anytime.</p>

            <BuildADash
              selected={selectedWidgets}
              onChange={setSelectedWidgets}
              inline
            />

            <div className="flex justify-between mt-8">
              <button onClick={back} className="text-zinc-400 hover:text-white text-sm transition-colors">← Back</button>
              <button
                onClick={handleFinish}
                className="bg-yellow-400 hover:bg-yellow-300 text-zinc-900 font-bold px-6 py-2 rounded-[4px] border-2 border-zinc-900 shadow-[2px_2px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Finish Setup →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function triggerConfetti() {
  // Simple CSS-based confetti burst using DOM
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden;';
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    const colors = ['#facc15', '#a78bfa', '#34d399', '#f87171', '#60a5fa'];
    piece.style.cssText = `
      position:absolute;
      width:${6 + Math.random() * 8}px;
      height:${6 + Math.random() * 8}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      left:${Math.random() * 100}%;
      top:-20px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      animation:confettiFall ${1.5 + Math.random() * 1.5}s ease-in forwards;
      transform:rotate(${Math.random() * 360}deg);
    `;
    el.appendChild(piece);
  }
  const style = document.createElement('style');
  style.textContent = `
    @keyframes confettiFall {
      to { transform: translateY(110vh) rotate(${Math.random() * 720}deg); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); style.remove(); }, 3000);
}
