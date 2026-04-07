import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';
import type { CardSet, UserData, DailyState } from './types';

const DEFAULT_USER: UserData = {
  streak: 0,
  lastActiveDate: null,
  earnedBadges: [],
  totalCardsStudied: 0,
};

const makeSet = (id: string): CardSet => ({
  id,
  name: `Set ${id}`,
  language1: 'Deutsch',
  language2: 'Englisch',
  cards: [],
  createdAt: 0,
});

beforeEach(() => {
  localStorage.clear();
  useStore.setState({ sets: [], user: { ...DEFAULT_USER }, progress: {}, daily: null, cardStats: {} });
});

// ── finishSession ────────────────────────────────────────────────────────────

describe('finishSession', () => {
  it('vergibt first_quiz beim ersten Quiz', () => {
    useStore.getState().finishSession('quiz', 75);
    expect(useStore.getState().user.earnedBadges).toContain('first_quiz');
  });

  it('vergibt first_test beim ersten Test', () => {
    useStore.getState().finishSession('test', 75);
    expect(useStore.getState().user.earnedBadges).toContain('first_test');
  });

  it('vergibt perfect_score bei 100%', () => {
    useStore.getState().finishSession('quiz', 100);
    expect(useStore.getState().user.earnedBadges).toContain('perfect_score');
  });

  it('vergibt first_quiz UND perfect_score atomar (kein Race Condition)', () => {
    useStore.getState().finishSession('quiz', 100);
    const badges = useStore.getState().user.earnedBadges;
    expect(badges).toContain('first_quiz');
    expect(badges).toContain('perfect_score');
  });

  it('vergibt first_test UND perfect_score atomar', () => {
    useStore.getState().finishSession('test', 100);
    const badges = useStore.getState().user.earnedBadges;
    expect(badges).toContain('first_test');
    expect(badges).toContain('perfect_score');
  });

  it('dupliziert keine Badges', () => {
    useStore.getState().finishSession('quiz', 100);
    useStore.getState().finishSession('quiz', 100);
    const badges = useStore.getState().user.earnedBadges;
    expect(badges.filter((b) => b === 'first_quiz')).toHaveLength(1);
    expect(badges.filter((b) => b === 'perfect_score')).toHaveLength(1);
  });

  it('vergibt first_test NICHT bei Modus quiz', () => {
    useStore.getState().finishSession('quiz', 100);
    expect(useStore.getState().user.earnedBadges).not.toContain('first_test');
  });

  it('vergibt first_quiz NICHT bei Modus test', () => {
    useStore.getState().finishSession('test', 100);
    expect(useStore.getState().user.earnedBadges).not.toContain('first_quiz');
  });

  it('vergibt perfect_score NICHT bei weniger als 100%', () => {
    useStore.getState().finishSession('quiz', 99);
    expect(useStore.getState().user.earnedBadges).not.toContain('perfect_score');
  });
});

// ── updateProgress / getSetProgress ─────────────────────────────────────────

describe('updateProgress', () => {
  it('aktualisiert den Store-State', () => {
    const p = { setId: 'set1', lastStudied: 100, bestQuizScore: 90, bestTestScore: 0, totalSessions: 1 };
    useStore.getState().updateProgress(p);
    expect(useStore.getState().progress['set1']).toEqual(p);
  });

  it('überschreibt vorherigen Fortschritt für dieselbe Set-ID', () => {
    useStore.getState().updateProgress({ setId: 'set1', lastStudied: 100, bestQuizScore: 50, bestTestScore: 0, totalSessions: 1 });
    useStore.getState().updateProgress({ setId: 'set1', lastStudied: 200, bestQuizScore: 90, bestTestScore: 0, totalSessions: 2 });
    expect(useStore.getState().progress['set1'].bestQuizScore).toBe(90);
  });

  it('behält Fortschritt anderer Sets', () => {
    useStore.getState().updateProgress({ setId: 'set1', lastStudied: 0, bestQuizScore: 80, bestTestScore: 0, totalSessions: 1 });
    useStore.getState().updateProgress({ setId: 'set2', lastStudied: 0, bestQuizScore: 60, bestTestScore: 0, totalSessions: 1 });
    expect(useStore.getState().progress['set1'].bestQuizScore).toBe(80);
    expect(useStore.getState().progress['set2'].bestQuizScore).toBe(60);
  });
});

describe('getSetProgress', () => {
  it('gibt Standardwerte für unbekannte Set-ID zurück', () => {
    const p = useStore.getState().getSetProgress('unbekannt');
    expect(p.bestQuizScore).toBe(0);
    expect(p.bestTestScore).toBe(0);
    expect(p.totalSessions).toBe(0);
  });

  it('gibt aktualisierten Fortschritt zurück', () => {
    const p = { setId: 'set1', lastStudied: 100, bestQuizScore: 85, bestTestScore: 70, totalSessions: 3 };
    useStore.getState().updateProgress(p);
    expect(useStore.getState().getSetProgress('set1')).toEqual(p);
  });
});

// ── removeSet ────────────────────────────────────────────────────────────────

describe('removeSet', () => {
  it('entfernt den Fortschritt des gelöschten Sets aus dem State', () => {
    useStore.setState({ sets: [makeSet('1')] });
    useStore.getState().updateProgress({ setId: '1', lastStudied: 0, bestQuizScore: 80, bestTestScore: 0, totalSessions: 1 });
    useStore.getState().removeSet('1');
    expect(useStore.getState().progress['1']).toBeUndefined();
  });

  it('behält Fortschritt anderer Sets', () => {
    useStore.setState({ sets: [makeSet('1'), makeSet('2')] });
    useStore.getState().updateProgress({ setId: '2', lastStudied: 0, bestQuizScore: 70, bestTestScore: 0, totalSessions: 1 });
    useStore.getState().removeSet('1');
    expect(useStore.getState().progress['2']?.bestQuizScore).toBe(70);
  });
});

// ── checkAndAwardBadges ──────────────────────────────────────────────────────

describe('checkAndAwardBadges', () => {
  it('vergibt first_set ab 1 Set', () => {
    useStore.setState({ sets: [makeSet('1')] });
    useStore.getState().checkAndAwardBadges();
    expect(useStore.getState().user.earnedBadges).toContain('first_set');
  });

  it('vergibt five_sets ab 5 Sets', () => {
    useStore.setState({ sets: ['1', '2', '3', '4', '5'].map(makeSet) });
    useStore.getState().checkAndAwardBadges();
    expect(useStore.getState().user.earnedBadges).toContain('five_sets');
  });

  it('vergibt five_sets NICHT bei 4 Sets', () => {
    useStore.setState({ sets: ['1', '2', '3', '4'].map(makeSet) });
    useStore.getState().checkAndAwardBadges();
    expect(useStore.getState().user.earnedBadges).not.toContain('five_sets');
  });

  it('vergibt streak_3 bei Streak ≥ 3', () => {
    useStore.setState({ user: { ...DEFAULT_USER, streak: 3 } });
    useStore.getState().checkAndAwardBadges();
    expect(useStore.getState().user.earnedBadges).toContain('streak_3');
  });

  it('vergibt streak_7 bei Streak ≥ 7', () => {
    useStore.setState({ user: { ...DEFAULT_USER, streak: 7 } });
    useStore.getState().checkAndAwardBadges();
    const badges = useStore.getState().user.earnedBadges;
    expect(badges).toContain('streak_3');
    expect(badges).toContain('streak_7');
  });

  it('vergibt streak_7 NICHT bei Streak = 5', () => {
    useStore.setState({ user: { ...DEFAULT_USER, streak: 5 } });
    useStore.getState().checkAndAwardBadges();
    expect(useStore.getState().user.earnedBadges).not.toContain('streak_7');
  });

  it('dupliziert keine bereits vergebenen Badges', () => {
    useStore.setState({ user: { ...DEFAULT_USER, streak: 3, earnedBadges: ['streak_3'] } });
    useStore.getState().checkAndAwardBadges();
    const badges = useStore.getState().user.earnedBadges;
    expect(badges.filter((b) => b === 'streak_3')).toHaveLength(1);
  });
});

// ── recordCardResult / getWeakCardIds ────────────────────────────────────────

describe('recordCardResult', () => {
  it('speichert ein korrektes Ergebnis', () => {
    useStore.getState().recordCardResult('set1', 'card1', true);
    const stats = useStore.getState().cardStats['set1']['card1'];
    expect(stats.correct).toBe(1);
    expect(stats.incorrect).toBe(0);
  });

  it('speichert ein falsches Ergebnis', () => {
    useStore.getState().recordCardResult('set1', 'card1', false);
    const stats = useStore.getState().cardStats['set1']['card1'];
    expect(stats.correct).toBe(0);
    expect(stats.incorrect).toBe(1);
  });

  it('akkumuliert mehrere Ergebnisse', () => {
    useStore.getState().recordCardResult('set1', 'card1', true);
    useStore.getState().recordCardResult('set1', 'card1', true);
    useStore.getState().recordCardResult('set1', 'card1', false);
    const stats = useStore.getState().cardStats['set1']['card1'];
    expect(stats.correct).toBe(2);
    expect(stats.incorrect).toBe(1);
  });
});

describe('getWeakCardIds', () => {
  it('gibt leeres Array zurück wenn keine Stats vorhanden', () => {
    expect(useStore.getState().getWeakCardIds('set1')).toEqual([]);
  });

  it('gibt Karten zurück wo incorrect > correct', () => {
    useStore.getState().recordCardResult('set1', 'card1', false);
    useStore.getState().recordCardResult('set1', 'card1', false);
    useStore.getState().recordCardResult('set1', 'card1', true);
    expect(useStore.getState().getWeakCardIds('set1')).toContain('card1');
  });

  it('gibt Karte NICHT zurück wenn correct >= incorrect', () => {
    useStore.getState().recordCardResult('set1', 'card1', true);
    useStore.getState().recordCardResult('set1', 'card1', false);
    expect(useStore.getState().getWeakCardIds('set1')).not.toContain('card1');
  });
});

// ── completeDaily ────────────────────────────────────────────────────────────

describe('completeDaily', () => {
  const makeDaily = (partial: Partial<DailyState> = {}): DailyState => ({
    date: new Date().toISOString().slice(0, 10),
    cards: [],
    completed: false,
    score: null,
    challengeStreak: 0,
    lastCompletedDate: null,
    ...partial,
  });

  it('markiert die Challenge als abgeschlossen', () => {
    useStore.setState({ daily: makeDaily() });
    useStore.getState().completeDaily(80);
    expect(useStore.getState().daily?.completed).toBe(true);
  });

  it('speichert den Score', () => {
    useStore.setState({ daily: makeDaily() });
    useStore.getState().completeDaily(75);
    expect(useStore.getState().daily?.score).toBe(75);
  });

  it('erhöht challengeStreak um 1', () => {
    useStore.setState({ daily: makeDaily({ challengeStreak: 3 }) });
    useStore.getState().completeDaily(100);
    expect(useStore.getState().daily?.challengeStreak).toBe(4);
  });

  it('macht nichts wenn bereits abgeschlossen', () => {
    useStore.setState({ daily: makeDaily({ completed: true, score: 50, challengeStreak: 2 }) });
    useStore.getState().completeDaily(100);
    expect(useStore.getState().daily?.score).toBe(50);
    expect(useStore.getState().daily?.challengeStreak).toBe(2);
  });

  it('macht nichts wenn daily null ist', () => {
    useStore.setState({ daily: null });
    expect(() => useStore.getState().completeDaily(100)).not.toThrow();
  });
});
