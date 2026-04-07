import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSets,
  saveSet,
  deleteSet,
  getProgress,
  getAllProgress,
  saveProgress,
  getUser,
  saveUser,
  recordActivity,
  addCardsStudied,
  updateCardResult,
  getDailyChallenge,
  saveDailyChallenge,
} from './storage';
import type { CardSet, SetProgress, UserData, DailyState } from './types';

const makeSet = (id: string): CardSet => ({
  id,
  name: `Set ${id}`,
  language1: 'Deutsch',
  language2: 'Englisch',
  cards: [],
  createdAt: 0,
});

const makeProgress = (setId: string, quizScore = 0, testScore = 0): SetProgress => ({
  setId,
  lastStudied: 100,
  bestQuizScore: quizScore,
  bestTestScore: testScore,
  totalSessions: 1,
});

beforeEach(() => {
  localStorage.clear();
});

// ── Sets ────────────────────────────────────────────────────────────────────

describe('getSets / saveSet / deleteSet', () => {
  it('startet leer', () => {
    expect(getSets()).toEqual([]);
  });

  it('speichert und liest ein Set', () => {
    const set = makeSet('1');
    saveSet(set);
    expect(getSets()).toContainEqual(set);
  });

  it('aktualisiert ein vorhandenes Set (kein Duplikat)', () => {
    saveSet(makeSet('1'));
    saveSet({ ...makeSet('1'), name: 'Aktualisiert' });
    expect(getSets()).toHaveLength(1);
    expect(getSets()[0].name).toBe('Aktualisiert');
  });

  it('löscht ein Set', () => {
    saveSet(makeSet('1'));
    saveSet(makeSet('2'));
    deleteSet('1');
    const sets = getSets();
    expect(sets).toHaveLength(1);
    expect(sets[0].id).toBe('2');
  });

  it('löscht den Fortschritt des Sets mit', () => {
    saveSet(makeSet('1'));
    saveProgress(makeProgress('1', 80));
    deleteSet('1');
    expect(getProgress('1').bestQuizScore).toBe(0);
  });
});

// ── Fortschritt ─────────────────────────────────────────────────────────────

describe('getProgress / saveProgress / getAllProgress', () => {
  it('gibt Standardwerte für unbekannte Set-ID zurück', () => {
    const p = getProgress('unbekannt');
    expect(p.bestQuizScore).toBe(0);
    expect(p.bestTestScore).toBe(0);
    expect(p.totalSessions).toBe(0);
  });

  it('speichert und liest Fortschritt', () => {
    const p = makeProgress('1', 90, 70);
    saveProgress(p);
    expect(getProgress('1')).toEqual(p);
  });

  it('aktualisiert vorhandenen Fortschritt (kein Duplikat)', () => {
    saveProgress(makeProgress('1', 50));
    saveProgress(makeProgress('1', 90));
    expect(getAllProgress()).toHaveLength(1);
    expect(getProgress('1').bestQuizScore).toBe(90);
  });

  it('getAllProgress gibt alle Einträge zurück', () => {
    saveProgress(makeProgress('1'));
    saveProgress(makeProgress('2'));
    expect(getAllProgress()).toHaveLength(2);
  });
});

// ── User & Streak ────────────────────────────────────────────────────────────

describe('getUser / saveUser', () => {
  it('gibt Standardnutzer zurück wenn keine Daten vorhanden', () => {
    const user = getUser();
    expect(user.streak).toBe(0);
    expect(user.earnedBadges).toEqual([]);
    expect(user.totalCardsStudied).toBe(0);
  });

  it('speichert und liest Nutzerdaten', () => {
    const user: UserData = { streak: 5, lastActiveDate: '2026-01-01', earnedBadges: ['first_set'], totalCardsStudied: 20 };
    saveUser(user);
    expect(getUser()).toEqual(user);
  });
});

describe('recordActivity', () => {
  it('setzt Streak auf 1 bei erster Aktivität', () => {
    const user = recordActivity();
    expect(user.streak).toBe(1);
  });

  it('erhöht Streak bei aufeinanderfolgenden Tagen', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    saveUser({ streak: 3, lastActiveDate: yesterday, earnedBadges: [], totalCardsStudied: 0 });
    const user = recordActivity();
    expect(user.streak).toBe(4);
  });

  it('setzt Streak zurück nach einem ausgelassenen Tag', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    saveUser({ streak: 7, lastActiveDate: twoDaysAgo, earnedBadges: [], totalCardsStudied: 0 });
    const user = recordActivity();
    expect(user.streak).toBe(1);
  });

  it('ändert Streak nicht wenn heute schon aktiv', () => {
    const today = new Date().toISOString().slice(0, 10);
    saveUser({ streak: 5, lastActiveDate: today, earnedBadges: [], totalCardsStudied: 0 });
    const user = recordActivity();
    expect(user.streak).toBe(5);
  });
});

describe('addCardsStudied', () => {
  it('erhöht totalCardsStudied', () => {
    const user = addCardsStudied(10);
    expect(user.totalCardsStudied).toBe(10);
  });

  it('addiert kumulativ', () => {
    addCardsStudied(10);
    const user = addCardsStudied(5);
    expect(user.totalCardsStudied).toBe(15);
  });
});

// ── updateCardResult ─────────────────────────────────────────────────────────

describe('updateCardResult', () => {
  it('erstellt neuen Eintrag für unbekannte Karte', () => {
    const stats = updateCardResult('set1', 'card1', true);
    expect(stats.cardId).toBe('card1');
    expect(stats.correct).toBe(1);
    expect(stats.incorrect).toBe(0);
  });

  it('erhöht incorrect bei falschem Ergebnis', () => {
    const stats = updateCardResult('set1', 'card1', false);
    expect(stats.incorrect).toBe(1);
    expect(stats.correct).toBe(0);
  });

  it('akkumuliert mehrere Ergebnisse', () => {
    updateCardResult('set1', 'card1', true);
    updateCardResult('set1', 'card1', true);
    const stats = updateCardResult('set1', 'card1', false);
    expect(stats.correct).toBe(2);
    expect(stats.incorrect).toBe(1);
  });

  it('trennt Stats nach setId', () => {
    updateCardResult('set1', 'card1', true);
    const stats = updateCardResult('set2', 'card1', false);
    expect(stats.incorrect).toBe(1);
    expect(stats.correct).toBe(0);
  });
});

// ── getDailyChallenge / saveDailyChallenge ───────────────────────────────────

describe('getDailyChallenge / saveDailyChallenge', () => {
  const makeDaily = (): DailyState => ({
    date: '2026-04-01',
    cards: [],
    completed: false,
    score: null,
    challengeStreak: 0,
    lastCompletedDate: null,
  });

  it('gibt null zurück wenn keine Daten vorhanden', () => {
    expect(getDailyChallenge()).toBeNull();
  });

  it('speichert und liest die Daily-Challenge', () => {
    const daily = makeDaily();
    saveDailyChallenge(daily);
    expect(getDailyChallenge()).toEqual(daily);
  });

  it('überschreibt vorherige Challenge', () => {
    saveDailyChallenge(makeDaily());
    const updated: DailyState = { ...makeDaily(), completed: true, score: 90, challengeStreak: 2 };
    saveDailyChallenge(updated);
    const loaded = getDailyChallenge();
    expect(loaded?.completed).toBe(true);
    expect(loaded?.score).toBe(90);
  });
});
