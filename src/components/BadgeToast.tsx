import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { BADGES } from '../badges';

export default function BadgeToast() {
  const pendingBadges = useStore((s) => s.pendingBadges);
  const dismissBadge = useStore((s) => s.dismissBadge);
  const [visible, setVisible] = useState(false);

  const currentId = pendingBadges[0] ?? null;
  const badge = BADGES.find((b) => b.id === currentId);

  useEffect(() => {
    if (!currentId) return;

    setVisible(false);
    const enterTimer = setTimeout(() => setVisible(true), 50);

    const exitTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => dismissBadge(), 350);
    }, 3500);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [currentId, dismissBadge]);

  if (!badge) return null;

  const Icon = badge.icon;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-350 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl px-5 py-3.5 flex items-center gap-3.5 min-w-[260px]">
        <div className="rounded-xl p-2.5 shrink-0" style={{ background: 'rgba(127,119,221,0.12)' }}>
          <Icon size={24} style={{ color: '#7F77DD' }} />
        </div>
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Badge freigeschaltet</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{badge.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{badge.description}</p>
        </div>
      </div>
    </div>
  );
}
