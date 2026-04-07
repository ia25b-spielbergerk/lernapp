import { PackageOpen, Target, PenLine, Star, Flame, Trophy, BookMarked, Layers } from 'lucide-react';
import type { Badge } from './types';

export const BADGES: Badge[] = [
  {
    id: 'first_set',
    name: 'Erstes Set',
    description: 'Dein erstes Kartenset erstellt',
    icon: PackageOpen,
    getProgress: (_user, sets) => ({ current: Math.min(sets.length, 1), max: 1 }),
  },
  {
    id: 'first_quiz',
    name: 'Erster Quiz',
    description: 'Dein erstes Quiz abgeschlossen',
    icon: Target,
    getProgress: (user) => ({ current: user.earnedBadges.includes('first_quiz') ? 1 : 0, max: 1 }),
  },
  {
    id: 'first_test',
    name: 'Erster Test',
    description: 'Deinen ersten Test abgeschlossen',
    icon: PenLine,
    getProgress: (user) => ({ current: user.earnedBadges.includes('first_test') ? 1 : 0, max: 1 }),
  },
  {
    id: 'perfect_score',
    name: 'Perfekt!',
    description: '100% in einem Quiz oder Test erreicht',
    icon: Star,
    getProgress: (user) => ({ current: user.earnedBadges.includes('perfect_score') ? 1 : 0, max: 1 }),
  },
  {
    id: 'streak_3',
    name: '3-Tage Streak',
    description: '3 Tage hintereinander gelernt',
    icon: Flame,
    getProgress: (user) => ({ current: Math.min(user.streak, 3), max: 3 }),
  },
  {
    id: 'streak_7',
    name: '7-Tage Streak',
    description: '7 Tage hintereinander gelernt',
    icon: Trophy,
    getProgress: (user) => ({ current: Math.min(user.streak, 7), max: 7 }),
  },
  {
    id: 'five_sets',
    name: 'Fleißig',
    description: '5 Kartensets erstellt',
    icon: BookMarked,
    getProgress: (_user, sets) => ({ current: Math.min(sets.length, 5), max: 5 }),
  },
  {
    id: 'fifty_cards',
    name: 'Kartenmeister',
    description: '50 Karten insgesamt gelernt',
    icon: Layers,
    getProgress: (user) => ({ current: Math.min(user.totalCardsStudied, 50), max: 50 }),
  },
];
