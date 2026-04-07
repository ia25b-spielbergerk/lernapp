import type { ReactNode } from 'react';
import BottomNav from './BottomNav';
import BadgeToast from './BadgeToast';
import LevelUpToast from './LevelUpToast';
import CrystalToast from './CrystalToast';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 pt-6 pb-24">{children}</main>
      <BadgeToast />
      <LevelUpToast />
      <CrystalToast />
      <BottomNav />
    </>
  );
}
