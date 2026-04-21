import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trophy, Award, TrendingUp, BookOpen, CalendarDays, Check, X, PackageOpen, Flame } from 'lucide-react';
import Layout from '../components/Layout';
import { useStore } from '../store';
import { isCloseEnough } from '../utils';
import type { DailyCard } from '../types';

type StudyDailyCard = DailyCard & { reversed: boolean };

interface Answer {
  card: StudyDailyCard;
  input: string;
  correct: boolean;
  almostCorrect: boolean;
}

export default function DailyChallenge() {
  const navigate = useNavigate();
  const daily = useStore((s) => s.daily);
  const completeDaily = useStore((s) => s.completeDaily);
  const recordCardResult = useStore((s) => s.recordCardResult);
  const markActivity = useStore((s) => s.markActivity);
  const addStudiedCards = useStore((s) => s.addStudiedCards);
  const addXp = useStore((s) => s.addXp);

  const mixed = localStorage.getItem('mixedMode') === 'true';
  const [studyCards] = useState<StudyDailyCard[]>(() => {
    if (!daily) return [];
    return daily.cards.map((c) => {
      if (mixed && Math.random() < 0.5) {
        return { ...c, front: c.back, back: c.front, reversed: true };
      }
      return { ...c, reversed: false };
    });
  });

  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!submitted) inputRef.current?.focus();
  }, [index, submitted]);

  // Heute bereits abgeschlossen
  if (daily?.completed && daily.score !== null) {
    const scoreColor = daily.score >= 80 ? '#1D9E75' : daily.score >= 50 ? '#EF9F27' : '#E24B4A';
    const ScoreIcon = daily.score === 100 ? Trophy : daily.score >= 80 ? Award : daily.score >= 50 ? TrendingUp : BookOpen;

    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-12">
          <div className="flex justify-center mb-4"><ScoreIcon size={52} style={{ color: scoreColor }} /></div>
          <h1 className="text-2xl font-bold app-text mb-2">Heute erledigt!</h1>
          <p className="text-6xl font-bold mb-3" style={{ color: scoreColor }}>{daily.score}%</p>
          {daily.challengeStreak > 1 && (
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 border" style={{ background: 'rgba(239,159,39,0.09)', borderColor: 'rgba(239,159,39,0.22)' }}>
              <Flame size={16} style={{ color: '#EF9F27' }} className="shrink-0" />
              <span className="font-semibold text-sm" style={{ color: '#EF9F27' }}>
                {daily.challengeStreak} Tage in Folge!
              </span>
            </div>
          )}
          <p className="text-[#888888] dark:text-white/40 text-sm mb-8">Morgen gibt es neue Karten</p>
          <button
            onClick={() => navigate('/')}
            className="text-white font-medium px-6 py-2.5 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
            style={{ backgroundColor: '#1D9E75' }}
          >
            Zur Startseite
          </button>
        </div>
      </Layout>
    );
  }

  // Keine Karten verfügbar
  if (!daily || daily.cards.length === 0) {
    return (
      <Layout>
        <div className="text-center py-20">
          <PackageOpen size={56} className="mx-auto mb-4 text-[#cccccc] dark:text-[#444444]" />
          <h3 className="text-lg font-semibold text-[#333333] dark:text-[#cccccc] mb-2">Keine Karten verfügbar</h3>
          <p className="text-[#888888] text-sm mb-6">Erstelle zuerst ein Vokabelset</p>
          <Link
            to="/sets/new"
            className="text-white font-medium px-6 py-2.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#7F77DD' }}
          >
            Set erstellen
          </Link>
        </div>
      </Layout>
    );
  }

  const card = studyCards[index];
  const lastAnswer = submitted ? answers[answers.length - 1] : null;
  const progress = (index / studyCards.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitted) return;

    const correct = isCloseEnough(input, card.back);
    const exact = input.trim().toLowerCase() === card.back.trim().toLowerCase();
    const almostCorrect = correct && !exact;

    if (!card.reversed) recordCardResult(card.setId, card.cardId, correct);
    setAnswers((prev) => [...prev, { card, input, correct, almostCorrect }]);
    setSubmitted(true);
  };

  const handleNext = () => {
    const isLast = index + 1 >= studyCards.length;
    if (isLast) {
      const correctCount = answers.filter((a) => a.correct).length;
      const score = Math.round((correctCount / studyCards.length) * 100);
      completeDaily(score);
      markActivity();
      addStudiedCards(studyCards.length);
      addXp(30 + (score === 100 ? 50 : 0));
    } else {
      setInput('');
      setSubmitted(false);
      setIndex((i) => i + 1);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="text-sm text-[#888888] hover:text-[#555555] dark:hover:text-[#cccccc]">
            ← Zurück
          </Link>
          <div className="flex items-center gap-3">
            {daily.challengeStreak > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1" style={{ background: 'rgba(239,159,39,0.12)', color: '#EF9F27' }}>
                <Flame size={11} />{daily.challengeStreak}
              </span>
            )}
            <span className="text-sm text-[#888888]">{index + 1} / {studyCards.length}</span>
          </div>
        </div>

        {/* Daily-Badge */}
        <div className="text-center mb-6">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}>
            <CalendarDays size={13} />
            Tages-Herausforderung
          </span>
        </div>

        {/* Fortschrittsbalken */}
        <div className="w-full bg-[#ebebeb] dark:bg-[#2a2a2a] rounded-full h-1.5 mb-8">
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Tagesfortschritt"
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: '#1D9E75' }}
          />
        </div>

        {/* Karte */}
        <div className="rounded-2xl p-6 mb-6 text-center border border-[#ebebeb] dark:border-white/10 bg-card">
          <p className="text-xs text-[#888888] mb-1 uppercase tracking-wide">{card.setName}</p>
          <p className="text-2xl font-semibold text-[#111111] dark:text-white">{card.front}</p>
        </div>

        {/* Eingabe */}
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitted}
            placeholder="Übersetzung eingeben..."
            className={`w-full border-2 rounded-xl px-4 py-3 text-base focus:outline-none transition-colors bg-white dark:bg-[#1a1a1a] ${
              submitted
                ? lastAnswer?.correct
                  ? 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'border-[#ebebeb] dark:border-white/15 dark:text-white focus:border-[#1D9E75] dark:focus:border-[#1D9E75]'
            }`}
          />
          {!submitted && (
            <button
              type="submit"
              disabled={!input.trim()}
              className="w-full mt-3 disabled:bg-[#ebebeb] dark:disabled:bg-[#2a2a2a] disabled:text-[#888888] text-white font-medium py-3 rounded-xl transition-colors cursor-pointer"
              style={input.trim() ? { backgroundColor: '#7F77DD' } : undefined}
            >
              Prüfen
            </button>
          )}
        </form>

        {/* Feedback */}
        {submitted && lastAnswer && (
          <>
            <div
              className="rounded-xl p-4 mb-4 border"
              style={lastAnswer.correct
                ? { borderColor: 'rgba(29,158,117,0.35)' }
                : { borderColor: 'rgba(226,75,74,0.35)' }
              }
            >
              {lastAnswer.correct ? (
                <div className="flex items-center gap-2">
                  <Check size={18} style={{ color: '#1D9E75' }} className="shrink-0" />
                  <p className="font-medium text-sm" style={{ color: '#1D9E75' }}>
                    {lastAnswer.almostCorrect ? `Fast! Richtige Antwort: "${card.back}"` : 'Richtig!'}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <X size={18} style={{ color: '#E24B4A' }} className="shrink-0" />
                    <p className="font-medium text-sm" style={{ color: '#E24B4A' }}>Falsch</p>
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(226,75,74,0.8)' }}>
                    Richtige Antwort: <span className="font-semibold">{card.back}</span>
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full text-white font-medium py-3 rounded-xl transition-colors cursor-pointer hover:opacity-90"
              style={{ backgroundColor: '#7F77DD' }}
            >
              {index + 1 >= studyCards.length ? 'Auswerten' : 'Weiter →'}
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
