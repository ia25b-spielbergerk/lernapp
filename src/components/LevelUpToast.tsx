import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useStore } from '../store';
import { getLevelInfo } from '../xp';

export default function LevelUpToast() {
  const pendingLevelUp = useStore((s) => s.pendingLevelUp);
  const dismissLevelUp = useStore((s) => s.dismissLevelUp);
  const [visible, setVisible] = useState(false);
  const [displayLevel, setDisplayLevel] = useState<number | null>(null);

  useEffect(() => {
    if (pendingLevelUp === null) return;
    setDisplayLevel(pendingLevelUp);
    const t1 = setTimeout(() => setVisible(true), 50);
    const t2 = setTimeout(() => setVisible(false), 3500);
    const t3 = setTimeout(() => dismissLevelUp(), 3850);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pendingLevelUp, dismissLevelUp]);

  if (displayLevel === null) return null;

  const levelName = getLevelInfo(0); // just for type reference
  const name = ['', 'Anfänger', 'Lernender', 'Fortgeschrittener', 'Experte', 'Meister', 'Legende', 'Guru'][displayLevel] ?? '';
  void levelName;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 bg-amber-500 dark:bg-amber-600 text-white px-5 py-3 rounded-2xl shadow-xl">
        <TrendingUp size={20} className="shrink-0" />
        <div>
          <p className="text-xs font-medium opacity-80 uppercase tracking-wide">Level Up!</p>
          <p className="text-sm font-bold">Level {displayLevel} – {name}</p>
        </div>
      </div>
    </div>
  );
}
