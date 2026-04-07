import type { CardSet, SetProgress, UserData, CardStats, DailyState, DiaryEntry, Task, Habit, Note } from './types';

const KEYS = {
  SETS: 'lernapp_sets',
  PROGRESS: 'lernapp_progress',
  USER: 'lernapp_user',
  CARD_STATS: 'lernapp_cardstats',
  DAILY: 'lernapp_daily',
  DIARY: 'lernapp_diary',
  TASKS: 'lernapp_tasks',
  HABITS: 'lernapp_habits',
  NOTES: 'lernapp_notes',
} as const;

// ── Hilfsfunktionen ─────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Sets ────────────────────────────────────────────────────────────────────

export function getSets(): CardSet[] {
  return load<CardSet[]>(KEYS.SETS, []);
}

export function saveSet(set: CardSet): void {
  const sets = getSets();
  const index = sets.findIndex((s) => s.id === set.id);
  if (index >= 0) {
    sets[index] = set;
  } else {
    sets.push(set);
  }
  save(KEYS.SETS, sets);
}

export function deleteSet(id: string): void {
  const sets = getSets().filter((s) => s.id !== id);
  save(KEYS.SETS, sets);
  // Fortschritt für dieses Set auch löschen
  const progress = getAllProgress().filter((p) => p.setId !== id);
  save(KEYS.PROGRESS, progress);
}

// ── Fortschritt ─────────────────────────────────────────────────────────────

export function getAllProgress(): SetProgress[] {
  return load<SetProgress[]>(KEYS.PROGRESS, []);
}

export function getProgress(setId: string): SetProgress {
  const all = getAllProgress();
  return (
    all.find((p) => p.setId === setId) ?? {
      setId,
      lastStudied: 0,
      bestQuizScore: 0,
      bestTestScore: 0,
      totalSessions: 0,
    }
  );
}

export function saveProgress(progress: SetProgress): void {
  const all = getAllProgress();
  const index = all.findIndex((p) => p.setId === progress.setId);
  if (index >= 0) {
    all[index] = progress;
  } else {
    all.push(progress);
  }
  save(KEYS.PROGRESS, all);
}

// ── User-Daten & Streak ──────────────────────────────────────────────────────

const DEFAULT_USER: UserData = {
  streak: 0,
  lastActiveDate: null,
  earnedBadges: [],
  totalCardsStudied: 0,
  xp: 0,
  crystals: 0,
};

export function getUser(): UserData {
  // Merge with defaults so existing users get new fields
  const stored = load<Partial<UserData>>(KEYS.USER, {});
  return { ...DEFAULT_USER, ...stored };
}

export function saveUser(user: UserData): void {
  save(KEYS.USER, user);
}

/**
 * Wird nach jeder abgeschlossenen Lernsession aufgerufen.
 * Aktualisiert Streak und gibt die neue UserData zurück.
 */
export function recordActivity(): UserData {
  const user = getUser();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (user.lastActiveDate === today) {
    // Heute schon aktiv gewesen – nichts ändern
    return user;
  }

  const newStreak =
    user.lastActiveDate === yesterday ? user.streak + 1 : 1;

  const updated: UserData = {
    ...user,
    streak: newStreak,
    lastActiveDate: today,
  };
  saveUser(updated);
  return updated;
}

export function addCardsStudied(count: number): UserData {
  const user = getUser();
  const updated: UserData = {
    ...user,
    totalCardsStudied: user.totalCardsStudied + count,
  };
  saveUser(updated);
  return updated;
}

export function addXpToUser(amount: number): { user: UserData; oldXp: number } {
  const user = getUser();
  const oldXp = user.xp ?? 0;
  const updated: UserData = { ...user, xp: oldXp + amount };
  saveUser(updated);
  return { user: updated, oldXp };
}

// ── Karten-Statistiken ───────────────────────────────────────────────────────

// Format: { [setId]: { [cardId]: CardStats } }
type CardStatsMap = Record<string, Record<string, CardStats>>;

export function getAllCardStats(): CardStatsMap {
  return load<CardStatsMap>(KEYS.CARD_STATS, {});
}

export function updateCardResult(setId: string, cardId: string, wasCorrect: boolean): CardStats {
  const all = getAllCardStats();
  const existing = all[setId]?.[cardId];

  const updated: CardStats = existing
    ? {
        ...existing,
        correct: existing.correct + (wasCorrect ? 1 : 0),
        incorrect: existing.incorrect + (wasCorrect ? 0 : 1),
        lastSeen: Date.now(),
      }
    : {
        cardId,
        setId,
        correct: wasCorrect ? 1 : 0,
        incorrect: wasCorrect ? 0 : 1,
        lastSeen: Date.now(),
      };

  save(KEYS.CARD_STATS, {
    ...all,
    [setId]: { ...(all[setId] ?? {}), [cardId]: updated },
  });

  return updated;
}

// ── Tages-Herausforderung ────────────────────────────────────────────────────

export function getDailyChallenge(): DailyState | null {
  return load<DailyState | null>(KEYS.DAILY, null);
}

export function saveDailyChallenge(daily: DailyState): void {
  save(KEYS.DAILY, daily);
}

// ── Tagebuch ─────────────────────────────────────────────────────────────────

export function getDiaryEntries(): DiaryEntry[] {
  return load<DiaryEntry[]>(KEYS.DIARY, []);
}

export function saveDiaryEntry(entry: DiaryEntry): void {
  const all = getDiaryEntries();
  const index = all.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    all[index] = entry;
  } else {
    all.push(entry);
  }
  save(KEYS.DIARY, all);
}

export function deleteDiaryEntry(id: string): void {
  save(KEYS.DIARY, getDiaryEntries().filter((e) => e.id !== id));
}

// ── Tasks ────────────────────────────────────────────────────────────────────

export function getTasks(): Task[] {
  return load<Task[]>(KEYS.TASKS, []);
}

export function saveTask(task: Task): void {
  const all = getTasks();
  const index = all.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    all[index] = task;
  } else {
    all.push(task);
  }
  save(KEYS.TASKS, all);
}

export function deleteTask(id: string): void {
  save(KEYS.TASKS, getTasks().filter((t) => t.id !== id));
}

// ── Gewohnheiten ─────────────────────────────────────────────────────────────

export function getHabits(): Habit[] {
  return load<Habit[]>(KEYS.HABITS, []);
}

export function saveHabit(habit: Habit): void {
  const all = getHabits();
  const index = all.findIndex((h) => h.id === habit.id);
  if (index >= 0) {
    all[index] = habit;
  } else {
    all.push(habit);
  }
  save(KEYS.HABITS, all);
}

export function deleteHabit(id: string): void {
  save(KEYS.HABITS, getHabits().filter((h) => h.id !== id));
}

// ── Notizen ──────────────────────────────────────────────────────────────────

export function getNotes(): Note[] {
  return load<Note[]>(KEYS.NOTES, []);
}

export function saveNote(note: Note): void {
  const all = getNotes();
  const index = all.findIndex((n) => n.id === note.id);
  if (index >= 0) {
    all[index] = note;
  } else {
    all.push(note);
  }
  save(KEYS.NOTES, all);
}

export function deleteNote(id: string): void {
  save(KEYS.NOTES, getNotes().filter((n) => n.id !== id));
}
