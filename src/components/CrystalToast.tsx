import { useEffect, useState } from 'react';
import { Gem } from 'lucide-react';
import { useStore } from '../store';

export default function CrystalToast() {
  const pendingCrystalGain = useStore((s) => s.pendingCrystalGain);
  const dismissCrystalGain = useStore((s) => s.dismissCrystalGain);
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!pendingCrystalGain) return;
    setDisplay(pendingCrystalGain);
    setVisible(true);
    const t1 = setTimeout(() => setVisible(false), 2500);
    const t2 = setTimeout(() => dismissCrystalGain(), 2850);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pendingCrystalGain, dismissCrystalGain]);

  if (!display) return null;

  return (
    <div
      className={`fixed top-16 right-4 z-50 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <div className="flex items-center gap-1.5 text-white text-sm font-semibold px-3 py-1.5 rounded-full shadow-lg" style={{ backgroundColor: '#378ADD' }}>
        <Gem size={13} className="text-white/70" />
        <span>+{display}</span>
      </div>
    </div>
  );
}
