import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useStore } from '../store';
import { BADGES } from '../badges';

export default function BadgesPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const sets = useStore((s) => s.sets);
  const diaryEntries = useStore((s) => s.diaryEntries);
  const habits = useStore((s) => s.habits);
  const tasks = useStore((s) => s.tasks);
  const notes = useStore((s) => s.notes);
  const earned = user.earnedBadges;

  const extra = { diaryEntries, habits, tasks, notes };

  const earnedBadges = BADGES.filter((b) => earned.includes(b.id));
  const lockedBadges = BADGES.filter((b) => !earned.includes(b.id));

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold app-text">Badges</h1>
            <p className="text-sm text-[#888888] dark:text-white/40 mt-1">
              {earned.length} von {BADGES.length} freigeschaltet
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="text-sm text-[#888888] dark:text-white/40 hover:text-[#555555] dark:hover:text-white/60 cursor-pointer">
            ← Zurück
          </button>
        </div>

        {/* Fortschrittsbalken — Violett */}
        <div className="w-full bg-[#ebebeb] dark:bg-[#2a2a2a] rounded-full h-2 mb-8">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${(earned.length / BADGES.length) * 100}%`, backgroundColor: '#7F77DD' }}
          />
        </div>

        {earnedBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="section-label mb-3">Erreicht</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {earnedBadges.map((badge) => {
                const Icon = badge.icon;
                const c = badge.color;
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center text-center rounded-xl p-4 border"
                    style={{ background: `${c}18`, borderColor: `${c}40` }}
                  >
                    <Icon size={36} className="mb-2" style={{ color: c }} />
                    <p className="text-sm font-semibold" style={{ color: c }}>{badge.name}</p>
                    <p className="text-xs mt-1" style={{ color: `${c}99` }}>{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {lockedBadges.length > 0 && (
          <div>
            <h2 className="section-label mb-3">Noch zu verdienen</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {lockedBadges.map((badge) => {
                const Icon = badge.icon;
                const { current, max } = badge.getProgress(user, sets, extra);
                const pct = max > 0 ? Math.round((current / max) * 100) : 0;
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center text-center bg-card border app-border rounded-xl p-4"
                  >
                    <Icon size={36} className="mb-2 text-[#cccccc] dark:text-white/20" />
                    <p className="text-sm font-semibold text-[#888888] dark:text-white/40">{badge.name}</p>
                    <p className="text-xs text-[#888888] dark:text-white/30 mt-1 mb-3">{badge.description}</p>
                    <div className="w-full mt-auto">
                      <div className="flex items-center justify-between text-xs text-[#888888] dark:text-white/30 mb-1">
                        <span>{current} / {max}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-[#ebebeb] dark:bg-[#2a2a2a] rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: badge.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
