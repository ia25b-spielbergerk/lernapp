import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useStore } from '../store';
import { BADGES } from '../badges';

export default function BadgesPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const sets = useStore((s) => s.sets);
  const earned = user.earnedBadges;

  const earnedBadges = BADGES.filter((b) => earned.includes(b.id));
  const lockedBadges = BADGES.filter((b) => !earned.includes(b.id));

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Badges</h1>
            <p className="text-sm text-gray-400 dark:text-white/40 mt-1">
              {earned.length} von {BADGES.length} freigeschaltet
            </p>
          </div>
          <button onClick={() => navigate(-1)} className="text-sm text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 cursor-pointer">
            ← Zurück
          </button>
        </div>

        {/* Fortschrittsbalken — Violett */}
        <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2 mb-8">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${(earned.length / BADGES.length) * 100}%`, backgroundColor: '#7F77DD' }}
          />
        </div>

        {earnedBadges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-white/40 uppercase tracking-wide mb-3">Erreicht</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {earnedBadges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center text-center rounded-xl p-4 border"
                    style={{ background: 'rgba(127,119,221,0.09)', borderColor: 'rgba(127,119,221,0.22)' }}
                  >
                    <Icon size={36} className="mb-2" style={{ color: '#7F77DD' }} />
                    <p className="text-sm font-semibold" style={{ color: '#7F77DD' }}>{badge.name}</p>
                    <p className="text-xs mt-1" style={{ color: 'rgba(127,119,221,0.6)' }}>{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {lockedBadges.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wide mb-3">Noch zu verdienen</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {lockedBadges.map((badge) => {
                const Icon = badge.icon;
                const { current, max } = badge.getProgress(user, sets);
                const pct = max > 0 ? Math.round((current / max) * 100) : 0;
                return (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center text-center bg-white dark:bg-white/5 border border-gray-100 dark:border-white/8 rounded-xl p-4"
                  >
                    <Icon size={36} className="mb-2 text-gray-300 dark:text-white/20" />
                    <p className="text-sm font-semibold text-gray-500 dark:text-white/40">{badge.name}</p>
                    <p className="text-xs text-gray-400 dark:text-white/30 mt-1 mb-3">{badge.description}</p>
                    <div className="w-full mt-auto">
                      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-white/30 mb-1">
                        <span>{current} / {max}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: '#7F77DD' }}
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
