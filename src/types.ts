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
  createdAt: string;
}

export interface SetProgress {
  setId: string;
  lastStudied: string;
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
  lastSeen: string;
}

export type BadgeId =
  // Lernen
  | 'first_set' | 'first_quiz' | 'first_test' | 'perfect_score'
  | 'streak_3' | 'streak_7' | 'five_sets' | 'fifty_cards'
  // Tagebuch
  | 'diary_first' | 'diary_streak_7' | 'diary_30' | 'diary_mood_5'
  // Habits
  | 'habit_first' | 'habit_streak_7' | 'habit_streak_30' | 'habit_allrounder'
  // Tasks
  | 'task_first' | 'task_10' | 'task_50' | 'task_perfect_day'
  // Notizen
  | 'note_first' | 'note_10' | 'note_tagged'
  // Kristalle
  | 'crystals_500' | 'crystals_1000' | 'crystals_5000';

export interface BadgeExtra {
  diaryEntries: DiaryEntry[];
  habits: Habit[];
  tasks: Task[];
  notes: Note[];
}

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: import('lucide-react').LucideIcon;
  color: string;
  getProgress: (user: UserData, sets: CardSet[], extra?: BadgeExtra) => { current: number; max: number };
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  streak: number;
  lastCheckedDate: string | null; // "2026-04-07"
  checkIns: string[];             // Array von Datumsstrings
}

// ── Täglicher Kristall-Tracker ───────────────────────────────────────────────

export interface DailyCrystalTracker {
  date: string;                  // "2026-04-08" — auto-reset bei neuem Tag
  diaryGranted: boolean;         // Tagebuch-Kristalle heute vergeben
  taskCrystals: number;          // Kristalle aus Tasks heute (cap: 50)
  rewardedTaskIds: string[];     // Task-IDs die heute Kristalle bekommen haben
  rewardedHabitIds: string[];    // Habit-IDs die heute Kristalle bekommen haben
  sessionCrystals: number;       // Kristalle aus Lerneinheiten heute (cap: 100)
  dailyChallengeGranted: boolean; // Daily-Challenge-Kristalle heute vergeben
  allDoneBonusGranted: boolean;  // "Alle Tasks erledigt"-Bonus heute vergeben
  totalCapped: number;           // Summe aller gecappten Kristalle heute (cap: 300)
}

// ── Notizen ──────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
