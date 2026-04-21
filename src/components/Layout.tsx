import type { ReactNode } from 'react';
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
import BadgeToast from './BadgeToast';
import LevelUpToast from './LevelUpToast';
import CrystalToast from './CrystalToast';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <main className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-8">{children}</main>
      </div>
      <BadgeToast />
      <LevelUpToast />
      <CrystalToast />
      <BottomNav />
    </div>
  );
}
