export interface Card {
  id: string;
  front: string; // Wort in Sprache 1
  back: string;  // Wort in Sprache 2
}

export interface CardSet {
  id: string;
  name: string;
  language1: string; // z.B. "Deutsch"
  language2: string; // z.B. "Englisch"
  cards: Card[];
  createdAt: number;
}

export interface SetProgress {
  setId: string;
  lastStudied: number;
  bestQuizScore: number;   // 0–100
  bestTestScore: number;   // 0–100
  totalSessions: number;
}

export interface DailyCard {
  cardId: string;
  setId: string;
  setName: string;
  front: string;
  back: string;
}

export interface DailyState {
  date: string;              // "2026-04-01"
  cards: DailyCard[];
  completed: boolean;
  score: number | null;
  challengeStreak: number;   // aufeinanderfolgende Tage
  lastCompletedDate: string | null;
}

export interface CardStats {
  cardId: string;
  setId: string;
  correct: number;
  incorrect: number;
  lastSeen: number;
}

export type BadgeId =
  | 'first_set'
  | 'first_quiz'
  | 'first_test'
  | 'perfect_score'
  | 'streak_3'
  | 'streak_7'
  | 'five_sets'
  | 'fifty_cards';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: import('lucide-react').LucideIcon;
  getProgress: (user: UserData, sets: CardSet[]) => { current: number; max: number };
}

export interface UserData {
  streak: number;
  lastActiveDate: string | null; // ISO date string "2026-03-31"
  earnedBadges: BadgeId[];
  totalCardsStudied: number;
  xp: number;
  crystals: number;
}

// ── Tagebuch ────────────────────────────────────────────────────────────────

export interface DiaryEntry {
  id: string;
  date: string;        // "2026-04-07"
  mood: 1 | 2 | 3 | 4 | 5;
  text: string;
  createdAt: number;
  updatedAt: number;
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export type TaskPriority = 'hoch' | 'mittel' | 'niedrig';
export type TaskRecurring = 'täglich' | 'wöchentlich' | null;

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  date: string;              // "2026-04-07" — der Tag dem der Task zugeordnet ist
  completed: boolean;
  recurring: TaskRecurring;
  completedDates: string[];  // Datumsstrings für wiederkehrende Tasks
}

// ── Gewohnheiten ─────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  createdAt: number;
  streak: number;
  lastCheckedDate: string | null; // "2026-04-07"
  checkIns: string[];             // Array von Datumsstrings
}

// ── Notizen ──────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}
