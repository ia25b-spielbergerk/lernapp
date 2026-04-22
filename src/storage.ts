import { supabase } from './lib/supabase';
import type {
  CardSet, SetProgress, UserData, CardStats, DailyState,
  DiaryEntry, Task, Habit, Note, DailyCrystalTracker, DailyCard,
} from './types';

// ── User / Profil (Supabase → profiles) ─────────────────────────────────────

export const DEFAULT_USER: UserData = {
  streak: 0,
  lastActiveDate: null,
  earnedBadges: [],
  totalCardsStudied: 0,
  xp: 0,
  crystals: 0,
};

export async function getUser(userId: string): Promise<UserData> {
  const { data, error } = await supabase
    .from('profiles')
    .select('streak, last_active_date, earned_badges, total_cards_studied, xp, crystals')
    .eq('id', userId)
    .single();

  if (error || !data) return { ...DEFAULT_USER };

  return {
    streak: (data.streak as number) ?? 0,
    lastActiveDate: (data.last_active_date as string) ?? null,
    earnedBadges: (data.earned_badges as UserData['earnedBadges']) ?? [],
    totalCardsStudied: (data.total_cards_studied as number) ?? 0,
    xp: (data.xp as number) ?? 0,
    crystals: (data.crystals as number) ?? 0,
  };
}

export async function saveUser(user: UserData, userId: string): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    streak: user.streak,
    last_active_date: user.lastActiveDate,
    earned_badges: user.earnedBadges,
    total_cards_studied: user.totalCardsStudied,
    xp: user.xp,
    crystals: user.crystals,
  });
  if (error) console.error('[DB] saveUser FEHLER:', error.message, error);
  else console.log('[DB] saveUser OK — xp:', user.xp, 'crystals:', user.crystals, 'streak:', user.streak);
}

export async function recordActivity(userId: string): Promise<UserData> {
  const user = await getUser(userId);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (user.lastActiveDate === today) return user;

  const updated: UserData = {
    ...user,
    streak: user.lastActiveDate === yesterday ? user.streak + 1 : 1,
    lastActiveDate: today,
  };
  await saveUser(updated, userId);
  return updated;
}

export async function addCardsStudied(count: number, userId: string): Promise<UserData> {
  const user = await getUser(userId);
  const updated: UserData = { ...user, totalCardsStudied: user.totalCardsStudied + count };
  await saveUser(updated, userId);
  return updated;
}

export async function addXpToUser(amount: number, userId: string): Promise<{ user: UserData; oldXp: number }> {
  const user = await getUser(userId);
  const oldXp = user.xp ?? 0;
  const updated: UserData = { ...user, xp: oldXp + amount };
  await saveUser(updated, userId);
  return { user: updated, oldXp };
}

// ── Sets (Supabase → card_sets + cards) ─────────────────────────────────────

function mapSet(row: Record<string, unknown>): CardSet {
  const cardsRaw = (row.cards as Record<string, unknown>[] | null) ?? [];
  return {
    id: row.id as string,
    name: row.name as string,
    language1: row.language1 as string,
    language2: row.language2 as string,
    createdAt: row.created_at as string,
    cards: cardsRaw.map((c) => ({
      id: c.id as string,
      front: c.front as string,
      back: c.back as string,
    })),
  };
}

export async function getSets(userId: string): Promise<CardSet[]> {
  const { data, error } = await supabase
    .from('card_sets')
    .select('*, cards(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { return []; }
  return (data ?? []).map(mapSet);
}

export async function saveSet(set: CardSet, userId: string): Promise<void> {
  const { error: setErr } = await supabase.from('card_sets').upsert({
    id: set.id,
    user_id: userId,
    name: set.name,
    language1: set.language1,
    language2: set.language2,
    created_at: set.createdAt,
  });
  if (setErr) return;

  const { error: delErr } = await supabase.from('cards').delete().eq('set_id', set.id).eq('user_id', userId);
  if (delErr) return;

  if (set.cards.length > 0) {
    await supabase.from('cards').insert(
      set.cards.map((c) => ({ id: c.id, set_id: set.id, user_id: userId, front: c.front, back: c.back }))
    );
  }
}

export async function deleteSet(id: string, userId: string): Promise<void> {
  await supabase.from('card_sets').delete().eq('id', id).eq('user_id', userId);
}

// ── Fortschritt (Supabase → card_progress) ──────────────────────────────────

export async function getAllProgress(userId: string): Promise<SetProgress[]> {
  const { data, error } = await supabase
    .from('card_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) { console.error('getAllProgress:', error.message); return []; }
  return (data ?? []).map((p) => ({
    setId: p.set_id as string,
    lastStudied: p.last_studied as string,
    bestQuizScore: (p.best_quiz_score as number) ?? 0,
    bestTestScore: (p.best_test_score as number) ?? 0,
    totalSessions: (p.total_sessions as number) ?? 0,
  }));
}

export async function saveProgress(progress: SetProgress, userId: string): Promise<void> {
  const { error } = await supabase.from('card_progress').upsert(
    {
      user_id: userId,
      set_id: progress.setId,
      last_studied: progress.lastStudied,
      best_quiz_score: progress.bestQuizScore,
      best_test_score: progress.bestTestScore,
      total_sessions: progress.totalSessions,
    },
    { onConflict: 'user_id,set_id' }
  );
  if (error) console.error('[DB] saveProgress FEHLER:', error.message, error);
  else console.log('[DB] saveProgress OK — set:', progress.setId, 'sessions:', progress.totalSessions);
}

// ── Karten-Statistiken (Supabase → card_stats) ───────────────────────────────

export async function getAllCardStats(userId: string): Promise<Record<string, Record<string, CardStats>>> {
  const { data, error } = await supabase
    .from('card_stats')
    .select('*')
    .eq('user_id', userId);

  if (error) { console.error('getAllCardStats:', error.message); return {}; }

  const result: Record<string, Record<string, CardStats>> = {};
  for (const row of (data ?? [])) {
    const setId = row.set_id as string;
    const cardId = row.card_id as string;
    if (!result[setId]) result[setId] = {};
    result[setId][cardId] = {
      cardId,
      setId,
      correct: (row.correct as number) ?? 0,
      incorrect: (row.incorrect as number) ?? 0,
      lastSeen: row.last_seen as string,
    };
  }
  return result;
}

export async function updateCardResult(
  setId: string,
  cardId: string,
  wasCorrect: boolean,
  userId: string,
  existing?: CardStats
): Promise<CardStats> {
  const updated: CardStats = existing
    ? {
        ...existing,
        correct: existing.correct + (wasCorrect ? 1 : 0),
        incorrect: existing.incorrect + (wasCorrect ? 0 : 1),
        lastSeen: new Date().toISOString(),
      }
    : { cardId, setId, correct: wasCorrect ? 1 : 0, incorrect: wasCorrect ? 0 : 1, lastSeen: new Date().toISOString() };

  const { error } = await supabase.from('card_stats').upsert(
    {
      user_id: userId,
      set_id: setId,
      card_id: cardId,
      correct: updated.correct,
      incorrect: updated.incorrect,
      last_seen: updated.lastSeen,
    },
    { onConflict: 'user_id,set_id,card_id' }
  );
  if (error) console.error('[DB] updateCardResult FEHLER:', error.message, error);
  else console.log('[DB] updateCardResult OK — card:', cardId, 'correct:', updated.correct, 'incorrect:', updated.incorrect);
  return updated;
}

// ── Tages-Herausforderung (Supabase → daily_challenge) ───────────────────────

export async function getDailyChallenge(userId: string): Promise<DailyState | null> {
  const { data, error } = await supabase
    .from('daily_challenge')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) { console.error('getDailyChallenge:', error.message); return null; }
  if (!data) return null;

  return {
    date: data.date as string,
    cards: (data.card_ids as DailyCard[]) ?? [],
    completed: data.completed as boolean,
    score: data.score as number | null,
    challengeStreak: (data.challenge_streak as number) ?? 0,
    lastCompletedDate: (data.last_completed_date as string) ?? null,
  };
}

export async function saveDailyChallenge(daily: DailyState, userId: string): Promise<void> {
  const { error } = await supabase.from('daily_challenge').upsert(
    {
      user_id: userId,
      date: daily.date,
      card_ids: daily.cards,
      completed: daily.completed,
      score: daily.score,
      challenge_streak: daily.challengeStreak,
      last_completed_date: daily.lastCompletedDate,
    },
    { onConflict: 'user_id' }
  );
  if (error) console.error('[DB] saveDailyChallenge FEHLER:', error.message, error);
  else console.log('[DB] saveDailyChallenge OK — completed:', daily.completed, 'score:', daily.score, 'streak:', daily.challengeStreak);
}

// ── Tagebuch (Supabase → diary_entries) ─────────────────────────────────────

export async function getDiaryEntries(userId: string): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) { console.error('getDiaryEntries:', error.message); return []; }
  return (data ?? []).map((d) => ({
    id: d.id as string,
    date: d.date as string,
    mood: d.mood as DiaryEntry['mood'],
    text: d.text as string,
    createdAt: d.created_at as string,
    updatedAt: d.updated_at as string,
  }));
}

export async function saveDiaryEntry(entry: DiaryEntry, userId: string): Promise<void> {
  const { error } = await supabase.from('diary_entries').upsert({
    id: entry.id,
    user_id: userId,
    date: entry.date,
    mood: entry.mood,
    text: entry.text,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  });
  if (error) console.error('saveDiaryEntry:', error.message);
}

export async function deleteDiaryEntry(id: string, userId: string): Promise<void> {
  await supabase.from('diary_entries').delete().eq('id', id).eq('user_id', userId);
}

// ── Tasks (Supabase → tasks) ─────────────────────────────────────────────────

export async function getTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) { console.error('getTasks:', error.message); return []; }
  return (data ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    priority: t.priority as Task['priority'],
    date: t.date as string,
    completed: t.completed as boolean,
    recurring: t.recurring as Task['recurring'],
    completedDates: (t.completed_dates as string[]) ?? [],
  }));
}

export async function saveTask(task: Task, userId: string): Promise<void> {
  await supabase.from('tasks').upsert({
    id: task.id,
    user_id: userId,
    title: task.title,
    priority: task.priority,
    date: task.date,
    completed: task.completed,
    recurring: task.recurring,
    completed_dates: task.completedDates,
  });
}

export async function deleteTask(id: string, userId: string): Promise<void> {
  await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId);
}

// ── Gewohnheiten (Supabase → habits + habit_checkins) ────────────────────────

export async function getHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*, habit_checkins(date)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) { console.error('getHabits:', error.message); return []; }
  return (data ?? []).map((h) => {
    const checkins = (h.habit_checkins as { date: string }[] | null) ?? [];
    return {
      id: h.id as string,
      name: h.name as string,
      createdAt: h.created_at as string,
      streak: (h.streak as number) ?? 0,
      lastCheckedDate: (h.last_checked_date as string) ?? null,
      checkIns: checkins.map((c) => c.date),
    };
  });
}

// Nur Habit-Metadaten speichern (Check-ins separat via addHabitCheckin/removeHabitCheckin)
export async function saveHabit(habit: Habit, userId: string): Promise<void> {
  await supabase.from('habits').upsert({
    id: habit.id,
    user_id: userId,
    name: habit.name,
    created_at: habit.createdAt,
    streak: habit.streak,
    last_checked_date: habit.lastCheckedDate,
  });
}

export async function addHabitCheckin(habitId: string, date: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('habit_checkins')
    .upsert({ habit_id: habitId, user_id: userId, date }, { onConflict: 'habit_id,date' });
  if (error) console.error('addHabitCheckin:', error.message);
}

export async function removeHabitCheckin(habitId: string, date: string, userId: string): Promise<void> {
  await supabase
    .from('habit_checkins')
    .delete()
    .eq('habit_id', habitId)
    .eq('date', date)
    .eq('user_id', userId);
}

export async function deleteHabit(id: string, userId: string): Promise<void> {
  await supabase.from('habits').delete().eq('id', id).eq('user_id', userId);
}

// ── Notizen (Supabase → notes) ───────────────────────────────────────────────

export async function getNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) { console.error('getNotes:', error.message); return []; }
  return (data ?? []).map((n) => ({
    id: n.id as string,
    title: n.title as string,
    content: n.content as string,
    tags: (n.tags as string[]) ?? [],
    pinned: n.pinned as boolean,
    createdAt: n.created_at as string,
    updatedAt: n.updated_at as string,
  }));
}

export async function saveNote(note: Note, userId: string): Promise<void> {
  const { error } = await supabase.from('notes').upsert({
    id: note.id,
    user_id: userId,
    title: note.title,
    content: note.content,
    tags: note.tags,
    pinned: note.pinned,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  });
  if (error) console.error('saveNote:', error.message);
}

export async function deleteNote(id: string, userId: string): Promise<void> {
  await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
}

// ── Täglicher Kristall-Tracker (Supabase → daily_crystal_tracker) ────────────

export const EMPTY_TRACKER = (date: string): DailyCrystalTracker => ({
  date,
  diaryGranted: false,
  taskCrystals: 0,
  rewardedTaskIds: [],
  rewardedHabitIds: [],
  sessionCrystals: 0,
  dailyChallengeGranted: false,
  allDoneBonusGranted: false,
  notesCrystals: 0,
  totalCapped: 0,
});

export async function getDailyCrystalTracker(userId: string): Promise<DailyCrystalTracker> {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('daily_crystal_tracker')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .maybeSingle();

  if (error) { console.error('getDailyCrystalTracker:', error.message); return EMPTY_TRACKER(today); }
  if (!data) return EMPTY_TRACKER(today);

  return {
    date: data.date as string,
    diaryGranted: data.diary_granted as boolean,
    taskCrystals: (data.task_crystals as number) ?? 0,
    rewardedTaskIds: (data.rewarded_task_ids as string[]) ?? [],
    rewardedHabitIds: (data.rewarded_habit_ids as string[]) ?? [],
    sessionCrystals: (data.session_crystals as number) ?? 0,
    dailyChallengeGranted: data.daily_challenge_granted as boolean,
    allDoneBonusGranted: data.all_done_bonus_granted as boolean,
    notesCrystals: (data.notes_crystals as number) ?? 0,
    totalCapped: (data.total_capped as number) ?? 0,
  };
}

export async function saveDailyCrystalTracker(tracker: DailyCrystalTracker, userId: string): Promise<void> {
  const { error } = await supabase.from('daily_crystal_tracker').upsert(
    {
      user_id: userId,
      date: tracker.date,
      diary_granted: tracker.diaryGranted,
      task_crystals: tracker.taskCrystals,
      rewarded_task_ids: tracker.rewardedTaskIds,
      rewarded_habit_ids: tracker.rewardedHabitIds,
      session_crystals: tracker.sessionCrystals,
      daily_challenge_granted: tracker.dailyChallengeGranted,
      all_done_bonus_granted: tracker.allDoneBonusGranted,
      notes_crystals: tracker.notesCrystals,
      total_capped: tracker.totalCapped,
    },
    { onConflict: 'user_id,date' }
  );
  if (error) console.error('[DB] saveDailyCrystalTracker FEHLER:', error.message, error);
  else console.log('[DB] saveDailyCrystalTracker OK — totalCapped:', tracker.totalCapped);
}
