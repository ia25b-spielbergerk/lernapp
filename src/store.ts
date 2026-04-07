import { create } from 'zustand';
import type { CardSet, SetProgress, UserData, BadgeId, CardStats, DailyState, DiaryEntry, Task, Habit, Note } from './types';
import {
  getSets,
  saveSet,
  deleteSet,
  getUser,
  saveUser,
  getAllProgress,
  saveProgress,
  recordActivity,
  addCardsStudied,
  addXpToUser,
  getAllCardStats,
  updateCardResult,
  getDailyChallenge,
  saveDailyChallenge,
  getDiaryEntries,
  saveDiaryEntry,
  deleteDiaryEntry,
  getTasks,
  saveTask,
  deleteTask,
  getHabits,
  saveHabit,
  deleteHabit,
  getNotes,
  saveNote,
  deleteNote,
} from './storage';
import { getLevelInfo } from './xp';
import { shuffle } from './utils';
import { BADGES } from './badges';

interface AppState {
  sets: CardSet[];
  user: UserData;
  progress: Record<string, SetProgress>;
  darkMode: boolean;
  cardStats: Record<string, Record<string, CardStats>>;
  daily: DailyState | null;
  diaryEntries: DiaryEntry[];
  tasks: Task[];
  habits: Habit[];
  notes: Note[];

  // Sets
  loadSets: () => void;
  addSet: (set: CardSet) => void;
  updateSet: (set: CardSet) => void;
  removeSet: (id: string) => void;

  // User & Streak
  loadUser: () => void;
  markActivity: () => void;
  addStudiedCards: (count: number) => void;

  // Fortschritt
  updateProgress: (progress: SetProgress) => void;
  getSetProgress: (setId: string) => SetProgress;

  // Badges
  checkAndAwardBadges: () => BadgeId[];
  finishSession: (mode: 'quiz' | 'test', score: number) => void;

  // Dark Mode
  toggleDarkMode: () => void;

  // Karten-Tracking
  recordCardResult: (setId: string, cardId: string, wasCorrect: boolean) => void;
  getWeakCardIds: (setId: string) => string[];

  // Tages-Herausforderung
  initDaily: () => void;
  completeDaily: (score: number) => void;

  // Badge-Benachrichtigungen
  pendingBadges: BadgeId[];
  dismissBadge: () => void;

  // XP & Level
  addXp: (amount: number) => void;
  pendingLevelUp: number | null;
  dismissLevelUp: () => void;

  // Kristalle
  addCrystals: (amount: number) => void;
  pendingCrystalGain: number;
  dismissCrystalGain: () => void;

  // Tagebuch
  saveDiary: (entry: DiaryEntry) => void;
  removeDiary: (id: string) => void;

  // Tasks
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (id: string) => void;
  completeTask: (taskId: string, date: string) => void;

  // Gewohnheiten
  addHabit: (habit: Habit) => void;
  updateHabit: (habit: Habit) => void;
  removeHabit: (id: string) => void;
  checkInHabit: (habitId: string, date: string) => void;

  // Notizen
  addNote: (note: Note) => void;
  updateNote: (note: Note) => void;
  removeNote: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  sets: [],
  user: getUser(),
  progress: Object.fromEntries(getAllProgress().map((p) => [p.setId, p])),
  darkMode: localStorage.getItem('lernapp_darkmode') === 'true',
  cardStats: getAllCardStats(),
  daily: getDailyChallenge(),
  pendingBadges: [],
  pendingLevelUp: null,
  pendingCrystalGain: 0,
  diaryEntries: getDiaryEntries(),
  tasks: getTasks(),
  habits: getHabits(),
  notes: getNotes(),

  // ── Sets ────────────────────────────────────────────────────────────────

  loadSets: () => set({ sets: getSets() }),

  addSet: (newSet) => {
    saveSet(newSet);
    set({ sets: getSets() });
    get().checkAndAwardBadges();
  },

  updateSet: (updated) => {
    saveSet(updated);
    set({ sets: getSets() });
  },

  removeSet: (id) => {
    deleteSet(id);
    set((state) => {
      const { [id]: _, ...rest } = state.progress;
      return { sets: getSets(), progress: rest };
    });
  },

  // ── User ────────────────────────────────────────────────────────────────

  loadUser: () => set({ user: getUser() }),

  markActivity: () => {
    const oldStreak = get().user.streak;
    const updated = recordActivity();

    // +100 Kristalle beim Erreichen eines 7-Tage Streaks
    const crystalGain = updated.streak === 7 && oldStreak < 7 ? 100 : 0;
    const withCrystals: UserData = crystalGain > 0
      ? { ...updated, crystals: (updated.crystals ?? 0) + crystalGain }
      : updated;

    if (crystalGain > 0) saveUser(withCrystals);
    set((state) => ({
      user: withCrystals,
      pendingCrystalGain: state.pendingCrystalGain + crystalGain,
    }));
    get().checkAndAwardBadges();
  },

  addStudiedCards: (count) => {
    const updated = addCardsStudied(count);
    set({ user: updated });
    get().checkAndAwardBadges();
  },

  // ── Fortschritt ─────────────────────────────────────────────────────────

  updateProgress: (progress) => {
    saveProgress(progress);
    set((state) => ({ progress: { ...state.progress, [progress.setId]: progress } }));
  },

  getSetProgress: (setId) => {
    const { progress } = get();
    return progress[setId] ?? { setId, lastStudied: 0, bestQuizScore: 0, bestTestScore: 0, totalSessions: 0 };
  },

  // ── Badges ──────────────────────────────────────────────────────────────

  checkAndAwardBadges: () => {
    const { sets, user } = get();
    const newBadges: BadgeId[] = [];

    const award = (id: BadgeId) => {
      if (!user.earnedBadges.includes(id)) newBadges.push(id);
    };

    if (sets.length >= 1) award('first_set');
    if (sets.length >= 5) award('five_sets');
    const totalCards = sets.reduce((sum, s) => sum + s.cards.length, 0);
    if (user.totalCardsStudied >= 50 || totalCards >= 50) award('fifty_cards');
    if (user.streak >= 3) award('streak_3');
    if (user.streak >= 7) award('streak_7');

    if (newBadges.length > 0) {
      const crystalGain = newBadges.length * 30;
      const updatedUser: UserData = {
        ...user,
        earnedBadges: [...user.earnedBadges, ...newBadges],
        crystals: (user.crystals ?? 0) + crystalGain,
      };
      saveUser(updatedUser);
      set((state) => ({
        user: updatedUser,
        pendingBadges: [...state.pendingBadges, ...newBadges],
        pendingCrystalGain: state.pendingCrystalGain + crystalGain,
      }));
    }

    return newBadges;
  },

  // Dark Mode
  toggleDarkMode: () => {
    const next = !get().darkMode;
    localStorage.setItem('lernapp_darkmode', String(next));
    set({ darkMode: next });
  },

  // Karten-Tracking
  recordCardResult: (setId, cardId, wasCorrect) => {
    const updated = updateCardResult(setId, cardId, wasCorrect);
    set((state) => ({
      cardStats: {
        ...state.cardStats,
        [setId]: { ...(state.cardStats[setId] ?? {}), [cardId]: updated },
      },
    }));
  },

  getWeakCardIds: (setId) => {
    const stats = get().cardStats[setId] ?? {};
    return Object.values(stats)
      .filter((s) => s.incorrect > s.correct)
      .map((s) => s.cardId);
  },

  // Tages-Herausforderung
  initDaily: () => {
    const today = new Date().toISOString().slice(0, 10);
    const { sets, daily: current } = get();
    const hasCards = sets.some((s) => s.cards.length > 0);

    if (current && current.date === today && (current.cards.length > 0 || !hasCards)) return;

    const stored = getDailyChallenge();
    if (stored && stored.date === today && (stored.cards.length > 0 || !hasCards)) {
      set({ daily: stored });
      return;
    }

    const allCards = sets.flatMap((s) =>
      s.cards.map((c) => ({ cardId: c.id, setId: s.id, setName: s.name, front: c.front, back: c.back }))
    );
    const selected = shuffle(allCards).slice(0, Math.min(10, allCards.length));
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const carriedStreak = stored?.lastCompletedDate === yesterday ? (stored.challengeStreak ?? 0) : 0;

    const newDaily: DailyState = {
      date: today,
      cards: selected,
      completed: false,
      score: null,
      challengeStreak: carriedStreak,
      lastCompletedDate: stored?.lastCompletedDate ?? null,
    };
    saveDailyChallenge(newDaily);
    set({ daily: newDaily });
  },

  completeDaily: (score) => {
    const { daily, user } = get();
    if (!daily || daily.completed) return;

    const today = new Date().toISOString().slice(0, 10);
    const updated: DailyState = {
      ...daily,
      completed: true,
      score,
      challengeStreak: daily.challengeStreak + 1,
      lastCompletedDate: today,
    };
    saveDailyChallenge(updated);

    // +20 Kristalle für abgeschlossene Daily Challenge
    const crystalGain = 20;
    const updatedUser: UserData = { ...user, crystals: (user.crystals ?? 0) + crystalGain };
    saveUser(updatedUser);
    set((state) => ({
      daily: updated,
      user: updatedUser,
      pendingCrystalGain: state.pendingCrystalGain + crystalGain,
    }));
  },

  // Session-Badges + Crystal-Belohnungen
  finishSession: (mode, score) => {
    const { user } = get();
    const toAward: BadgeId[] = [];
    let crystalGain = 0;

    if (mode === 'quiz' && !user.earnedBadges.includes('first_quiz')) { toAward.push('first_quiz'); crystalGain += 30; }
    if (mode === 'test' && !user.earnedBadges.includes('first_test')) { toAward.push('first_test'); crystalGain += 30; }
    if (score === 100 && !user.earnedBadges.includes('perfect_score')) { toAward.push('perfect_score'); crystalGain += 30; }
    if (score === 100) crystalGain += 15; // immer +15 bei 100%

    if (toAward.length > 0 || crystalGain > 0) {
      const updatedUser: UserData = {
        ...user,
        earnedBadges: [...user.earnedBadges, ...toAward],
        crystals: (user.crystals ?? 0) + crystalGain,
      };
      saveUser(updatedUser);
      set((state) => ({
        user: updatedUser,
        pendingBadges: toAward.length > 0 ? [...state.pendingBadges, ...toAward] : state.pendingBadges,
        pendingCrystalGain: crystalGain > 0 ? state.pendingCrystalGain + crystalGain : state.pendingCrystalGain,
      }));
    }
  },

  dismissBadge: () => set((state) => ({ pendingBadges: state.pendingBadges.slice(1) })),

  // XP & Level
  addXp: (amount) => {
    const { user: oldUser } = get();
    const oldLevel = getLevelInfo(oldUser.xp ?? 0).level;
    const { user: newUser } = addXpToUser(amount);
    const newLevel = getLevelInfo(newUser.xp).level;
    const leveledUp = newLevel > oldLevel;

    // +50 Kristalle bei Level-Up
    const crystalGain = leveledUp ? 50 : 0;
    const withCrystals: UserData = crystalGain > 0
      ? { ...newUser, crystals: (newUser.crystals ?? 0) + crystalGain }
      : newUser;

    if (crystalGain > 0) saveUser(withCrystals);
    set((state) => ({
      user: withCrystals,
      pendingLevelUp: leveledUp ? newLevel : state.pendingLevelUp,
      pendingCrystalGain: state.pendingCrystalGain + crystalGain,
    }));
  },

  dismissLevelUp: () => set({ pendingLevelUp: null }),

  // ── Kristalle ────────────────────────────────────────────────────────────

  addCrystals: (amount) => {
    const user = get().user;
    const updated: UserData = { ...user, crystals: (user.crystals ?? 0) + amount };
    saveUser(updated);
    set((state) => ({
      user: updated,
      pendingCrystalGain: state.pendingCrystalGain + amount,
    }));
  },

  dismissCrystalGain: () => set({ pendingCrystalGain: 0 }),

  // ── Tagebuch ─────────────────────────────────────────────────────────────

  saveDiary: (entry) => {
    const isNew = !get().diaryEntries.find((e) => e.id === entry.id);
    saveDiaryEntry(entry);
    set({ diaryEntries: getDiaryEntries() });

    // +10 Kristalle für neuen Eintrag (einmal pro Tag)
    if (isNew) {
      const today = new Date().toISOString().slice(0, 10);
      if (entry.date === today) {
        get().addCrystals(10);
      }
    }
  },

  removeDiary: (id) => {
    deleteDiaryEntry(id);
    set({ diaryEntries: getDiaryEntries() });
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────

  addTask: (task) => {
    saveTask(task);
    set({ tasks: getTasks() });
  },

  updateTask: (task) => {
    saveTask(task);
    set({ tasks: getTasks() });
  },

  removeTask: (id) => {
    deleteTask(id);
    set({ tasks: getTasks() });
  },

  completeTask: (taskId, date) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    let updated: Task;
    if (task.recurring) {
      // Wiederkehrend: Datum in completedDates eintragen
      const alreadyDone = task.completedDates.includes(date);
      if (alreadyDone) {
        updated = { ...task, completedDates: task.completedDates.filter((d) => d !== date) };
      } else {
        updated = { ...task, completedDates: [...task.completedDates, date] };
      }
    } else {
      updated = { ...task, completed: !task.completed };
    }

    const wasCompleted = task.recurring
      ? task.completedDates.includes(date)
      : task.completed;
    const isNowCompleted = task.recurring
      ? updated.completedDates.includes(date)
      : updated.completed;

    saveTask(updated);
    set({ tasks: getTasks() });

    if (isNowCompleted && !wasCompleted) {
      get().addCrystals(5);

      // Bonus +25 wenn alle Tasks des Tages erledigt
      const allTasks = getTasks();
      const todayTasks = allTasks.filter((t) => {
        if (t.recurring === 'täglich') return true;
        if (t.recurring === 'wöchentlich') {
          // Prüfe ob der Task diese Woche noch nicht erledigt wurde
          const dayOfWeek = new Date(date).getDay();
          const startOfWeek = new Date(date);
          startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
          return !t.completedDates.some((d) => {
            const dDate = new Date(d);
            return dDate >= startOfWeek && dDate <= new Date(date);
          });
        }
        return t.date === date;
      });
      const allDone = todayTasks.length > 0 && todayTasks.every((t) => {
        if (t.recurring) return t.completedDates.includes(date);
        return t.id === taskId ? true : t.completed;
      });
      if (allDone) get().addCrystals(25);
    }
  },

  // ── Gewohnheiten ──────────────────────────────────────────────────────────

  addHabit: (habit) => {
    saveHabit(habit);
    set({ habits: getHabits() });
  },

  updateHabit: (habit) => {
    saveHabit(habit);
    set({ habits: getHabits() });
  },

  removeHabit: (id) => {
    deleteHabit(id);
    set({ habits: getHabits() });
  },

  checkInHabit: (habitId, date) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const alreadyChecked = habit.checkIns.includes(date);

    let updated: Habit;
    if (alreadyChecked) {
      // Rückgängig machen — Streak neu berechnen
      const newCheckIns = habit.checkIns.filter((d) => d !== date);
      // Streak = aufeinanderfolgende Tage bis zum letzten verbleibenden Check-In
      const sorted = [...newCheckIns].sort().reverse();
      let newStreak = 0;
      if (sorted.length > 0) {
        let current = sorted[0];
        for (const d of sorted) {
          if (d === current) {
            newStreak++;
            current = new Date(new Date(current).getTime() - 86400000).toISOString().slice(0, 10);
          } else {
            break;
          }
        }
      }
      updated = {
        ...habit,
        checkIns: newCheckIns,
        streak: newStreak,
        lastCheckedDate: sorted[0] ?? null,
      };
    } else {
      const newCheckIns = [...habit.checkIns, date];
      const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().slice(0, 10);
      const newStreak = habit.lastCheckedDate === yesterday || habit.lastCheckedDate === date
        ? habit.streak + 1
        : 1;
      updated = { ...habit, checkIns: newCheckIns, streak: newStreak, lastCheckedDate: date };
    }

    saveHabit(updated);
    set({ habits: getHabits() });

    if (!alreadyChecked) {
      get().addCrystals(10);

      // Bonus +20 wenn alle Habits an diesem Tag erledigt
      const allHabits = getHabits();
      const allDone = allHabits.length > 0 && allHabits.every((h) =>
        h.id === habitId ? true : h.checkIns.includes(date)
      );
      if (allDone) get().addCrystals(20);
    }
  },

  // ── Notizen ───────────────────────────────────────────────────────────────

  addNote: (note) => {
    saveNote(note);
    set({ notes: getNotes() });
    get().addCrystals(5);
  },

  updateNote: (note) => {
    saveNote(note);
    set({ notes: getNotes() });
  },

  removeNote: (id) => {
    deleteNote(id);
    set({ notes: getNotes() });
  },
}));

export { BADGES };
