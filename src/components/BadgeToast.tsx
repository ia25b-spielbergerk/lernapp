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
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] shadow-xl rounded-2xl px-5 py-3.5 flex items-center gap-3.5 min-w-[260px]">
        <div className="rounded-xl p-2.5 shrink-0" style={{ background: `${badge.color}20` }}>
          <Icon size={24} style={{ color: badge.color }} />
        </div>
        <div>
          <p className="text-xs text-[#888888] font-medium uppercase tracking-wide">Badge freigeschaltet</p>
          <p className="text-sm font-semibold text-[#111111] dark:text-white">{badge.name}</p>
          <p className="text-xs text-[#888888] mt-0.5">{badge.description}</p>
        </div>
      </div>
    </div>
  );
}
