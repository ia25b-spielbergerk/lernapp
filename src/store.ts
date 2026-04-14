import { create } from 'zustand';
import type { CardSet, SetProgress, UserData, BadgeId, CardStats, DailyState, DiaryEntry, Task, Habit, Note, DailyCrystalTracker } from './types';
import {
  DEFAULT_USER,
  EMPTY_TRACKER,
  getUser,
  saveUser,
  getSets,
  saveSet,
  deleteSet,
  getAllProgress,
  saveProgress,
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
  addHabitCheckin,
  removeHabitCheckin,
  getNotes,
  saveNote,
  deleteNote,
  getDailyCrystalTracker,
  saveDailyCrystalTracker,
} from './storage';
import { getLevelInfo } from './xp';
import { shuffle } from './utils';
import { BADGES } from './badges';

function maxConsecutiveDays(dates: string[]): number {
  const sorted = [...new Set(dates)].sort();
  if (sorted.length === 0) return 0;
  let max = 1, curr = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff =
      (new Date(sorted[i] + 'T12:00:00').getTime() -
        new Date(sorted[i - 1] + 'T12:00:00').getTime()) /
      86400000;
    if (diff === 1) { curr++; if (curr > max) max = curr; }
    else curr = 1;
  }
  return max;
}

interface AppState {
  currentUserId: string | null;
  isLoading: boolean;
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
  dailyCrystals: DailyCrystalTracker;

  // Auth
  setCurrentUser: (id: string | null) => void;
  loadAllData: () => void;
  loadCriticalData: () => Promise<void>;
  loadBackgroundData: () => void;

  // Sets
  addSet: (set: CardSet) => void;
  updateSet: (set: CardSet) => void;
  removeSet: (id: string) => void;

  // User & Streak
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

const today0 = new Date().toISOString().slice(0, 10);

export const useStore = create<AppState>((set, get) => ({
  currentUserId: null,
  isLoading: false,
  sets: [],
  user: { ...DEFAULT_USER },
  progress: {},
  darkMode: localStorage.getItem('lernapp_darkmode') === 'true',
  cardStats: {},
  daily: null,
  pendingBadges: [],
  pendingLevelUp: null,
  pendingCrystalGain: 0,
  diaryEntries: [],
  tasks: [],
  habits: [],
  notes: [],
  dailyCrystals: EMPTY_TRACKER(today0),

  // ── Auth ─────────────────────────────────────────────────────────────────

  setCurrentUser: (id) => {
    set({ currentUserId: id });
    if (!id) {
      const today = new Date().toISOString().slice(0, 10);
      set({
        sets: [],
        user: { ...DEFAULT_USER },
        progress: {},
        cardStats: {},
        daily: null,
        diaryEntries: [],
        tasks: [],
        habits: [],
        notes: [],
        dailyCrystals: EMPTY_TRACKER(today),
      });
    }
  },

  // Kritische Daten zuerst (User, Tasks, Habits) — Dashboard sofort nutzbar
  loadCriticalData: async () => {
    const userId = get().currentUserId;
    if (!userId) return;
    set({ isLoading: true });
    try {
      const [user, tasks, habits] = await Promise.all([
        getUser(userId),
        getTasks(userId),
        getHabits(userId),
      ]);
      set({ user, tasks, habits, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Restliche Daten im Hintergrund nachladen
  loadBackgroundData: () => {
    const userId = get().currentUserId;
    if (!userId) return;
    Promise.all([
      getSets(userId),
      getAllProgress(userId),
      getAllCardStats(userId),
      getDailyChallenge(userId),
      getDiaryEntries(userId),
      getNotes(userId),
      getDailyCrystalTracker(userId),
    ]).then(([sets, progressArr, cardStats, daily, diaryEntries, notes, dailyCrystals]) => {
      const progress = Object.fromEntries(progressArr.map((p) => [p.setId, p]));
      set({ sets, progress, cardStats, daily, diaryEntries, notes, dailyCrystals });
      get().initDaily();
    }).catch(console.error);
  },

  loadAllData: () => {
    const store = get();
    store.loadCriticalData().then(() => store.loadBackgroundData());
  },

  // ── Sets ────────────────────────────────────────────────────────────────

  addSet: (newSet) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ sets: [newSet, ...state.sets] }));
    saveSet(newSet, userId).catch(console.error);
    get().checkAndAwardBadges();
  },

  updateSet: (updated) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ sets: state.sets.map((s) => s.id === updated.id ? updated : s) }));
    saveSet(updated, userId).catch(console.error);
  },

  removeSet: (id) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => {
      const { [id]: _, ...rest } = state.progress;
      return { sets: state.sets.filter((s) => s.id !== id), progress: rest };
    });
    deleteSet(id).catch(console.error);
  },

  // ── User ────────────────────────────────────────────────────────────────

  markActivity: () => {
    const userId = get().currentUserId;
    const user = get().user;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (user.lastActiveDate === today) return;

    const oldStreak = user.streak;
    const updated: UserData = {
      ...user,
      streak: user.lastActiveDate === yesterday ? user.streak + 1 : 1,
      lastActiveDate: today,
    };

    const crystalGain = updated.streak === 7 && oldStreak < 7 ? 100 : 0;
    const withCrystals: UserData = crystalGain > 0
      ? { ...updated, crystals: (updated.crystals ?? 0) + crystalGain }
      : updated;

    set((state) => ({
      user: withCrystals,
      pendingCrystalGain: state.pendingCrystalGain + crystalGain,
    }));
    if (userId) saveUser(withCrystals, userId).catch(console.error);
    get().checkAndAwardBadges();
  },

  addStudiedCards: (count) => {
    const userId = get().currentUserId;
    const user = get().user;
    const updated: UserData = { ...user, totalCardsStudied: user.totalCardsStudied + count };
    set({ user: updated });
    if (userId) saveUser(updated, userId).catch(console.error);
    get().checkAndAwardBadges();
  },

  // ── Fortschritt ─────────────────────────────────────────────────────────

  updateProgress: (progress) => {
    const userId = get().currentUserId;
    set((state) => ({ progress: { ...state.progress, [progress.setId]: progress } }));
    if (userId) saveProgress(progress, userId).catch(console.error);
  },

  getSetProgress: (setId) => {
    const { progress } = get();
    return progress[setId] ?? { setId, lastStudied: new Date(0).toISOString(), bestQuizScore: 0, bestTestScore: 0, totalSessions: 0 };
  },

  // ── Badges ──────────────────────────────────────────────────────────────

  checkAndAwardBadges: () => {
    const userId = get().currentUserId;
    const { sets, user, diaryEntries, habits, tasks, notes } = get();
    const newBadges: BadgeId[] = [];

    const award = (id: BadgeId) => {
      if (!user.earnedBadges.includes(id)) newBadges.push(id);
    };

    // Lernen
    if (sets.length >= 1) award('first_set');
    if (sets.length >= 5) award('five_sets');
    const totalCards = sets.reduce((sum, s) => sum + s.cards.length, 0);
    if (user.totalCardsStudied >= 50 || totalCards >= 50) award('fifty_cards');
    if (user.streak >= 3) award('streak_3');
    if (user.streak >= 7) award('streak_7');

    // Tagebuch
    if (diaryEntries.length >= 1) award('diary_first');
    if (maxConsecutiveDays(diaryEntries.map((e) => e.date)) >= 7) award('diary_streak_7');
    if (diaryEntries.length >= 30) award('diary_30');
    if (diaryEntries.filter((e) => e.mood === 5).length >= 5) award('diary_mood_5');

    // Habits
    if (habits.length >= 1) award('habit_first');
    const bestHabitStreak = Math.max(0, ...habits.map((h) => h.streak));
    if (bestHabitStreak >= 7) award('habit_streak_7');
    if (bestHabitStreak >= 30) award('habit_streak_30');

    // Tasks
    const totalDone =
      tasks.filter((t) => !t.recurring && t.completed).length +
      tasks.reduce((s, t) => s + t.completedDates.length, 0);
    if (totalDone >= 1) award('task_first');
    if (totalDone >= 10) award('task_10');
    if (totalDone >= 50) award('task_50');

    // Notizen
    if (notes.length >= 1) award('note_first');
    if (notes.length >= 10) award('note_10');
    if (notes.some((n) => n.tags.length > 0)) award('note_tagged');

    // Kristalle
    if ((user.crystals ?? 0) >= 500) award('crystals_500');
    if ((user.crystals ?? 0) >= 1000) award('crystals_1000');
    if ((user.crystals ?? 0) >= 5000) award('crystals_5000');

    if (newBadges.length > 0) {
      const crystalGain = newBadges.length * 30;
      const updatedUser: UserData = {
        ...user,
        earnedBadges: [...user.earnedBadges, ...newBadges],
        crystals: (user.crystals ?? 0) + crystalGain,
      };
      if (userId) saveUser(updatedUser, userId).catch(console.error);
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
    const userId = get().currentUserId;
    if (!userId) return;
    const existing = get().cardStats[setId]?.[cardId];
    const updated: CardStats = existing
      ? {
          ...existing,
          correct: existing.correct + (wasCorrect ? 1 : 0),
          incorrect: existing.incorrect + (wasCorrect ? 0 : 1),
          lastSeen: new Date().toISOString(),
        }
      : { cardId, setId, correct: wasCorrect ? 1 : 0, incorrect: wasCorrect ? 0 : 1, lastSeen: new Date().toISOString() };

    set((state) => ({
      cardStats: {
        ...state.cardStats,
        [setId]: { ...(state.cardStats[setId] ?? {}), [cardId]: updated },
      },
    }));
    updateCardResult(setId, cardId, wasCorrect, userId, existing).catch(console.error);
  },

  getWeakCardIds: (setId) => {
    const stats = get().cardStats[setId] ?? {};
    return Object.values(stats)
      .filter((s) => s.incorrect > s.correct)
      .map((s) => s.cardId);
  },

  // Tages-Herausforderung
  initDaily: () => {
    const userId = get().currentUserId;
    const today = new Date().toISOString().slice(0, 10);
    const { sets, daily: stored } = get();
    const hasCards = sets.some((s) => s.cards.length > 0);

    if (stored && stored.date === today && (stored.cards.length > 0 || !hasCards)) return;

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
    set({ daily: newDaily });
    if (userId) saveDailyChallenge(newDaily, userId).catch(console.error);
  },

  completeDaily: (score) => {
    const userId = get().currentUserId;
    if (!userId) return;
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

    const t = get().dailyCrystals;
    const crystalGain = (!t.dailyChallengeGranted && t.totalCapped < 300)
      ? Math.min(20, 300 - t.totalCapped)
      : 0;
    const nt: DailyCrystalTracker = { ...t, dailyChallengeGranted: true, totalCapped: t.totalCapped + crystalGain };
    const updatedUser: UserData = crystalGain > 0
      ? { ...user, crystals: (user.crystals ?? 0) + crystalGain }
      : user;

    set((state) => ({
      daily: updated,
      user: updatedUser,
      dailyCrystals: nt,
      pendingCrystalGain: state.pendingCrystalGain + crystalGain,
    }));
    saveDailyChallenge(updated, userId).catch(console.error);
    if (crystalGain > 0) saveUser(updatedUser, userId).catch(console.error);
    saveDailyCrystalTracker(nt, userId).catch(console.error);
  },

  // Session-Badges + Crystal-Belohnungen
  finishSession: (mode, score) => {
    const userId = get().currentUserId;
    const { user } = get();
    const toAward: BadgeId[] = [];
    let crystalGain = 0;

    if (mode === 'quiz' && !user.earnedBadges.includes('first_quiz')) { toAward.push('first_quiz'); crystalGain += 30; }
    if (mode === 'test' && !user.earnedBadges.includes('first_test')) { toAward.push('first_test'); crystalGain += 30; }
    if (score === 100 && !user.earnedBadges.includes('perfect_score')) { toAward.push('perfect_score'); crystalGain += 30; }
    // +15 bei 100% — gecappt: max 100 Kristalle/Tag aus Lerneinheiten
    if (score === 100) {
      const t = get().dailyCrystals;
      const sessionBonus = Math.max(0, Math.min(15, 100 - t.sessionCrystals, 300 - t.totalCapped));
      if (sessionBonus > 0) {
        crystalGain += sessionBonus;
        const nt: DailyCrystalTracker = { ...t, sessionCrystals: t.sessionCrystals + sessionBonus, totalCapped: t.totalCapped + sessionBonus };
        if (userId) saveDailyCrystalTracker(nt, userId).catch(console.error);
        set({ dailyCrystals: nt });
      }
    }

    if (toAward.length > 0 || crystalGain > 0) {
      const updatedUser: UserData = {
        ...user,
        earnedBadges: [...user.earnedBadges, ...toAward],
        crystals: (user.crystals ?? 0) + crystalGain,
      };
      if (userId) saveUser(updatedUser, userId).catch(console.error);
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
    const userId = get().currentUserId;
    const { user: oldUser } = get();
    const oldLevel = getLevelInfo(oldUser.xp ?? 0).level;
    const newXp = (oldUser.xp ?? 0) + amount;
    const newUser: UserData = { ...oldUser, xp: newXp };
    const newLevel = getLevelInfo(newXp).level;
    const leveledUp = newLevel > oldLevel;

    const crystalGain = leveledUp ? 50 : 0;
    const withCrystals: UserData = crystalGain > 0
      ? { ...newUser, crystals: (newUser.crystals ?? 0) + crystalGain }
      : newUser;

    set((state) => ({
      user: withCrystals,
      pendingLevelUp: leveledUp ? newLevel : state.pendingLevelUp,
      pendingCrystalGain: state.pendingCrystalGain + crystalGain,
    }));
    if (userId) saveUser(withCrystals, userId).catch(console.error);
  },

  dismissLevelUp: () => set({ pendingLevelUp: null }),

  // ── Kristalle ────────────────────────────────────────────────────────────

  addCrystals: (amount) => {
    const userId = get().currentUserId;
    const user = get().user;
    const updated: UserData = { ...user, crystals: (user.crystals ?? 0) + amount };
    set((state) => ({
      user: updated,
      pendingCrystalGain: state.pendingCrystalGain + amount,
    }));
    if (userId) saveUser(updated, userId).catch(console.error);
  },

  dismissCrystalGain: () => set({ pendingCrystalGain: 0 }),

  // ── Tagebuch ─────────────────────────────────────────────────────────────

  saveDiary: (entry) => {
    const userId = get().currentUserId;
    if (!userId) return;
    const isNew = !get().diaryEntries.find((e) => e.id === entry.id);
    set((state) => ({
      diaryEntries: isNew
        ? [entry, ...state.diaryEntries]
        : state.diaryEntries.map((e) => e.id === entry.id ? entry : e),
    }));
    saveDiaryEntry(entry, userId).catch(console.error);

    if (isNew) {
      const today = new Date().toISOString().slice(0, 10);
      if (entry.date === today) {
        const t = get().dailyCrystals;
        if (!t.diaryGranted && t.totalCapped < 300) {
          const grant = Math.min(10, 300 - t.totalCapped);
          const nt: DailyCrystalTracker = { ...t, diaryGranted: true, totalCapped: t.totalCapped + grant };
          const cu = get().user;
          const nu: UserData = { ...cu, crystals: (cu.crystals ?? 0) + grant };
          saveUser(nu, userId).catch(console.error);
          saveDailyCrystalTracker(nt, userId).catch(console.error);
          set((state) => ({ user: nu, dailyCrystals: nt, pendingCrystalGain: state.pendingCrystalGain + grant }));
        }
      }
    }
    get().checkAndAwardBadges();
  },

  removeDiary: (id) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ diaryEntries: state.diaryEntries.filter((e) => e.id !== id) }));
    deleteDiaryEntry(id).catch(console.error);
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────

  addTask: (task) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ tasks: [...state.tasks, task] }));
    saveTask(task, userId).catch(console.error);
  },

  updateTask: (task) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ tasks: state.tasks.map((t) => t.id === task.id ? task : t) }));
    saveTask(task, userId).catch(console.error);
  },

  removeTask: (id) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
    deleteTask(id).catch(console.error);
  },

  completeTask: (taskId, date) => {
    const userId = get().currentUserId;
    if (!userId) return;
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    let updated: Task;
    if (task.recurring) {
      const alreadyDone = task.completedDates.includes(date);
      if (alreadyDone) {
        updated = { ...task, completedDates: task.completedDates.filter((d) => d !== date) };
      } else {
        updated = { ...task, completedDates: [...task.completedDates, date] };
      }
    } else {
      updated = { ...task, completed: !task.completed };
    }

    const wasCompleted = task.recurring ? task.completedDates.includes(date) : task.completed;
    const isNowCompleted = task.recurring ? updated.completedDates.includes(date) : updated.completed;

    set((state) => ({ tasks: state.tasks.map((t) => t.id === taskId ? updated : t) }));
    saveTask(updated, userId).catch(console.error);

    if (isNowCompleted && !wasCompleted) {
      // +5 pro Task — gecappt: max 50/Tag, kein erneutes Vergeben
      const t = get().dailyCrystals;
      if (!t.rewardedTaskIds.includes(taskId) && t.taskCrystals < 50 && t.totalCapped < 300) {
        const grant = Math.min(5, 50 - t.taskCrystals, 300 - t.totalCapped);
        const nt: DailyCrystalTracker = { ...t, rewardedTaskIds: [...t.rewardedTaskIds, taskId], taskCrystals: t.taskCrystals + grant, totalCapped: t.totalCapped + grant };
        const cu = get().user;
        const nu: UserData = { ...cu, crystals: (cu.crystals ?? 0) + grant };
        saveUser(nu, userId).catch(console.error);
        saveDailyCrystalTracker(nt, userId).catch(console.error);
        set((state) => ({ user: nu, dailyCrystals: nt, pendingCrystalGain: state.pendingCrystalGain + grant }));
      }

      // Bonus +25 wenn alle Tasks des Tages erledigt
      const allTasks = get().tasks;
      const todayTasks = allTasks.filter((t) => {
        if (t.recurring === 'täglich') return true;
        if (t.recurring === 'wöchentlich') {
          const sel = new Date(date + 'T00:00:00');
          const startOfWeek = new Date(sel);
          startOfWeek.setDate(startOfWeek.getDate() - sel.getDay());
          const startStr = startOfWeek.toISOString().slice(0, 10);
          const doneThisWeek = t.completedDates.some((d) => d >= startStr && d <= date);
          const doneToday = t.completedDates.includes(date);
          return !doneThisWeek || doneToday;
        }
        return t.date === date;
      });
      const allDone = todayTasks.length > 0 && todayTasks.every((t) => {
        if (t.recurring) return t.completedDates.includes(date);
        return t.completed;
      });
      if (allDone) {
        const t2 = get().dailyCrystals;
        if (!t2.allDoneBonusGranted && t2.taskCrystals < 50 && t2.totalCapped < 300) {
          const grant2 = Math.min(25, 50 - t2.taskCrystals, 300 - t2.totalCapped);
          const nt2: DailyCrystalTracker = { ...t2, allDoneBonusGranted: true, taskCrystals: t2.taskCrystals + grant2, totalCapped: t2.totalCapped + grant2 };
          const cu2 = get().user;
          const nu2: UserData = { ...cu2, crystals: (cu2.crystals ?? 0) + grant2 };
          saveUser(nu2, userId).catch(console.error);
          saveDailyCrystalTracker(nt2, userId).catch(console.error);
          set((state) => ({ user: nu2, dailyCrystals: nt2, pendingCrystalGain: state.pendingCrystalGain + grant2 }));
        }
        // task_perfect_day Badge
        const { user: u } = get();
        if (!u.earnedBadges.includes('task_perfect_day')) {
          const updatedUser: UserData = {
            ...u,
            earnedBadges: [...u.earnedBadges, 'task_perfect_day'],
            crystals: (u.crystals ?? 0) + 30,
          };
          saveUser(updatedUser, userId).catch(console.error);
          set((state) => ({
            user: updatedUser,
            pendingBadges: [...state.pendingBadges, 'task_perfect_day'],
            pendingCrystalGain: state.pendingCrystalGain + 30,
          }));
        }
      }
    }
    get().checkAndAwardBadges();
  },

  // ── Gewohnheiten ──────────────────────────────────────────────────────────

  addHabit: (habit) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ habits: [...state.habits, habit] }));
    saveHabit(habit, userId).catch(console.error);
    get().checkAndAwardBadges();
  },

  updateHabit: (habit) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ habits: state.habits.map((h) => h.id === habit.id ? habit : h) }));
    saveHabit(habit, userId).catch(console.error);
  },

  removeHabit: (id) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ habits: state.habits.filter((h) => h.id !== id) }));
    deleteHabit(id).catch(console.error);
  },

  checkInHabit: (habitId, date) => {
    const userId = get().currentUserId;
    if (!userId) return;
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;

    const alreadyChecked = habit.checkIns.includes(date);

    let updated: Habit;
    if (alreadyChecked) {
      const newCheckIns = habit.checkIns.filter((d) => d !== date);
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
      updated = { ...habit, checkIns: newCheckIns, streak: newStreak, lastCheckedDate: sorted[0] ?? null };
    } else {
      const newCheckIns = [...habit.checkIns, date];
      const yesterday = new Date(new Date(date).getTime() - 86400000).toISOString().slice(0, 10);
      const newStreak = habit.lastCheckedDate === yesterday || habit.lastCheckedDate === date
        ? habit.streak + 1
        : 1;
      updated = { ...habit, checkIns: newCheckIns, streak: newStreak, lastCheckedDate: date };
    }

    set((state) => ({ habits: state.habits.map((h) => h.id === habitId ? updated : h) }));
    saveHabit(updated, userId).catch(console.error);

    if (alreadyChecked) {
      removeHabitCheckin(habitId, date).catch(console.error);
    } else {
      addHabitCheckin(habitId, date, userId).catch(console.error);

      // +10 pro Habit pro Tag — gecappt, kein erneutes Vergeben nach Rückgängig+Abhaken
      const t = get().dailyCrystals;
      if (!t.rewardedHabitIds.includes(habitId) && t.totalCapped < 300) {
        const grant = Math.min(10, 300 - t.totalCapped);
        const nt: DailyCrystalTracker = { ...t, rewardedHabitIds: [...t.rewardedHabitIds, habitId], totalCapped: t.totalCapped + grant };
        const cu = get().user;
        const nu: UserData = { ...cu, crystals: (cu.crystals ?? 0) + grant };
        saveUser(nu, userId).catch(console.error);
        saveDailyCrystalTracker(nt, userId).catch(console.error);
        set((state) => ({ user: nu, dailyCrystals: nt, pendingCrystalGain: state.pendingCrystalGain + grant }));
      }

      // Bonus +20 wenn alle Habits an diesem Tag erledigt
      const allHabits = get().habits;
      const allDone = allHabits.length > 0 && allHabits.every((h) => h.checkIns.includes(date));
      if (allDone) {
        const t2 = get().dailyCrystals;
        if (t2.totalCapped < 300) {
          const grant2 = Math.min(20, 300 - t2.totalCapped);
          const nt2: DailyCrystalTracker = { ...t2, totalCapped: t2.totalCapped + grant2 };
          const cu2 = get().user;
          const nu2: UserData = { ...cu2, crystals: (cu2.crystals ?? 0) + grant2 };
          saveUser(nu2, userId).catch(console.error);
          saveDailyCrystalTracker(nt2, userId).catch(console.error);
          set((state) => ({ user: nu2, dailyCrystals: nt2, pendingCrystalGain: state.pendingCrystalGain + grant2 }));
        }
        // habit_allrounder Badge
        const { user: u } = get();
        if (!u.earnedBadges.includes('habit_allrounder')) {
          const updatedUser: UserData = {
            ...u,
            earnedBadges: [...u.earnedBadges, 'habit_allrounder'],
            crystals: (u.crystals ?? 0) + 30,
          };
          saveUser(updatedUser, userId).catch(console.error);
          set((state) => ({
            user: updatedUser,
            pendingBadges: [...state.pendingBadges, 'habit_allrounder'],
            pendingCrystalGain: state.pendingCrystalGain + 30,
          }));
        }
      }
    }
    get().checkAndAwardBadges();
  },

  // ── Notizen ───────────────────────────────────────────────────────────────

  addNote: (note) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ notes: [note, ...state.notes] }));
    saveNote(note, userId).catch(console.error);
    get().addCrystals(5);
    get().checkAndAwardBadges();
  },

  updateNote: (note) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ notes: state.notes.map((n) => n.id === note.id ? note : n) }));
    saveNote(note, userId).catch(console.error);
    get().checkAndAwardBadges();
  },

  removeNote: (id) => {
    const userId = get().currentUserId;
    if (!userId) return;
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
    deleteNote(id).catch(console.error);
  },
}));

export { BADGES };
