import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Trophy, Award, TrendingUp, BookOpen, HelpCircle, Check, X, Zap } from 'lucide-react';
import Layout from '../components/Layout';
import ConfirmLeaveModal from '../components/ConfirmLeaveModal';
import { useStore } from '../store';
import { shuffle, isCloseEnough } from '../utils';
import type { Card } from '../types';

const SHOW_DURATION = 3000; // ms

type StudyCard = Card & { reversed: boolean };

interface Answer {
  card: StudyCard;
  input: string;
  correct: boolean;
}

type Phase = 'showing' | 'input' | 'result' | 'done';

export default function BlitzMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mixed: boolean = location.state?.mixed ?? false;
  const sets = useStore((s) => s.sets);
  const updateProgress = useStore((s) => s.updateProgress);
  const getSetProgress = useStore((s) => s.getSetProgress);
  const markActivity = useStore((s) => s.markActivity);
  const addStudiedCards = useStore((s) => s.addStudiedCards);
  const recordCardResult = useStore((s) => s.recordCardResult);
  const addXp = useStore((s) => s.addXp);

  const set = sets.find((s) => s.id === id);

  const [cards, setCards] = useState<StudyCard[]>(() => {
    if (!set) return [];
    return shuffle(set.cards.map((c) => {
      if (mixed && Math.random() < 0.5) {
        return { id: c.id, front: c.back, back: c.front, reversed: true };
      }
      return { ...c, reversed: false };
    }));
  });
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('showing');
  const [timeLeft, setTimeLeft] = useState(100); // 0–100%
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Countdown während der Showing-Phase
  useEffect(() => {
    if (phase !== 'showing') return;
    setTimeLeft(100);
    const start = Date.now();
    const interval = setInterval(() => {
      const pct = Math.max(0, 1 - (Date.now() - start) / SHOW_DURATION);
      setTimeLeft(pct * 100);
      if (pct === 0) {
        clearInterval(interval);
        setPhase('input');
      }
    }, 30);
    return () => clearInterval(interval);
  }, [phase, index]);

  // Eingabefeld automatisch fokussieren
  useEffect(() => {
    if (phase === 'input') inputRef.current?.focus();
  }, [phase]);

  if (!set || cards.length === 0) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-400">Set nicht gefunden.</p>
          <Link to="/" className="text-sm mt-2 inline-block" style={{ color: '#7F77DD' }}>← Zurück</Link>
        </div>
      </Layout>
    );
  }

  const card = cards[index];
  const lastAnswer = answers[answers.length - 1];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || phase !== 'input') return;
    const correct = isCloseEnough(input, card.back);
    if (!card.reversed) recordCardResult(id!, card.id, correct);
    setAnswers((prev) => [...prev, { card, input, correct }]);
    setPhase('result');
  };

  const handleNext = () => {
    const isLast = index + 1 >= cards.length;
    if (isLast) {
      const correctCount = answers.filter((a) => a.correct).length;
      const prev = getSetProgress(id!);
      updateProgress({
        ...prev,
        setId: id!,
        lastStudied: Date.now(),
        totalSessions: prev.totalSessions + 1,
      });
      const score = Math.round((correctCount / cards.length) * 100);
      addStudiedCards(cards.length);
      markActivity();
      addXp(15 + (score === 100 ? 50 : 0));
      setPhase('done');
    } else {
      setInput('');
      setIndex((i) => i + 1);
      setPhase('showing');
    }
  };

  const handleReset = () => {
    setCards(shuffle(set.cards.map((c) => {
      if (mixed && Math.random() < 0.5) {
        return { id: c.id, front: c.back, back: c.front, reversed: true };
      }
      return { ...c, reversed: false };
    })));
    setIndex(0);
    setAnswers([]);
    setInput('');
    setPhase('showing');
  };

  const timerBg =
    timeLeft > 50 ? '#7F77DD' : timeLeft > 20 ? '#EF9F27' : '#E24B4A';

  // ── Ergebnis-Bildschirm ──────────────────────────────────────────────────

  if (phase === 'done') {
    const correctCount = answers.filter((a) => a.correct).length;
    const score = Math.round((correctCount / cards.length) * 100);
    const wrong = answers.filter((a) => !a.correct);
    const scoreColor = score >= 80 ? '#1D9E75' : score >= 50 ? '#EF9F27' : '#E24B4A';
    const ScoreIcon = score === 100 ? Trophy : score >= 80 ? Award : score >= 50 ? TrendingUp : BookOpen;

    return (
      <Layout>
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3"><ScoreIcon size={52} style={{ color: scoreColor }} /></div>
            <p className="text-6xl font-bold" style={{ color: scoreColor }}>{score}%</p>
            <p className="text-gray-400 text-sm mt-2">
              {score === 100 ? 'Perfekt! Alles aus dem Gedächtnis!' : score >= 80 ? 'Starkes Gedächtnis!' : score >= 50 ? 'Gut, weiter üben!' : 'Noch etwas Übung nötig'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center bg-white dark:bg-white/5 border border-gray-100 dark:border-white/8 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{cards.length}</p>
              <p className="text-xs text-gray-400 mt-1">Karten</p>
            </div>
            <div className="text-center rounded-xl p-4 border" style={{ background: 'rgba(29,158,117,0.09)', borderColor: 'rgba(29,158,117,0.22)' }}>
              <p className="text-2xl font-bold" style={{ color: '#1D9E75' }}>{correctCount}</p>
              <p className="text-xs text-gray-400 mt-1">Richtig</p>
            </div>
            <div className="text-center rounded-xl p-4 border" style={{ background: 'rgba(226,75,74,0.09)', borderColor: 'rgba(226,75,74,0.22)' }}>
              <p className="text-2xl font-bold" style={{ color: '#E24B4A' }}>{wrong.length}</p>
              <p className="text-xs text-gray-400 mt-1">Falsch</p>
            </div>
          </div>

          {wrong.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Noch zu lernen:</h2>
              <div className="space-y-2">
                {wrong.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3 flex items-center justify-between gap-4 border"
                    style={{ background: 'rgba(226,75,74,0.07)', borderColor: 'rgba(226,75,74,0.18)' }}
                  >
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{a.card.front}</p>
                      <p className="text-sm line-through" style={{ color: '#E24B4A' }}>{a.input || '—'}</p>
                    </div>
                    <p className="text-sm font-semibold shrink-0" style={{ color: '#1D9E75' }}>→ {a.card.back}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/sets/${id}/study`)}
              className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
            >
              Zurück
            </button>
            <button
              onClick={handleReset}
              className="flex-1 text-white font-medium py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: '#7F77DD' }}
            >
              Nochmal <Zap size={15} />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Haupt-Lernbildschirm ─────────────────────────────────────────────────

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setConfirmLeave(true)}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ← Zurück
          </button>
          <span className="text-sm text-gray-400">{index + 1} / {cards.length}</span>
        </div>

        {/* Gesamt-Fortschrittsbalken */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-6">
          <div
            role="progressbar"
            aria-valuenow={Math.round((index / cards.length) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Blitzfortschritt"
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(index / cards.length) * 100}%`, backgroundColor: '#7F77DD' }}
          />
        </div>

        {/* Showing-Phase */}
        {phase === 'showing' && (
          <>
            {/* Countdown-Balken */}
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mb-6 overflow-hidden">
              <div
                className="h-2.5 rounded-full transition-none"
                style={{ width: `${timeLeft}%`, backgroundColor: timerBg }}
              />
            </div>

            <div className="rounded-2xl p-10 text-center shadow-sm border-2 border-gray-100 dark:border-white/10 bg-white dark:bg-white/5">
              <p className="text-xs text-gray-400 mb-4 uppercase tracking-wide">{card.reversed ? set.language2 : set.language1}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{card.front}</p>
              <p className="text-xs mt-8" style={{ color: '#7F77DD' }}>Präge es dir ein!</p>
            </div>
          </>
        )}

        {/* Input-Phase */}
        {phase === 'input' && (
          <>
            <div className="bg-gray-50 dark:bg-gray-800/60 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-10 text-center mb-6">
              <HelpCircle size={44} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Was war das Wort auf <span className="font-semibold">{card.reversed ? set.language1 : set.language2}</span>?
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Übersetzung auf ${card.reversed ? set.language1 : set.language2}...`}
                className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#7F77DD] transition-colors mb-3"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-full disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-3 rounded-xl transition-colors cursor-pointer"
                style={input.trim() ? { backgroundColor: '#7F77DD' } : undefined}
              >
                Prüfen
              </button>
              <p className="text-center text-xs text-gray-300 dark:text-gray-600 mt-2">Kleine Tippfehler werden akzeptiert</p>
            </form>
          </>
        )}

        {/* Result-Phase */}
        {phase === 'result' && lastAnswer && (
          <>
            <div
              className="rounded-2xl p-6 mb-5 text-center border-2"
              style={lastAnswer.correct
                ? { background: 'rgba(29,158,117,0.09)', borderColor: 'rgba(29,158,117,0.35)' }
                : { background: 'rgba(226,75,74,0.09)', borderColor: 'rgba(226,75,74,0.35)' }
              }
            >
              <div className="flex justify-center mb-2">
                {lastAnswer.correct
                  ? <Check size={32} style={{ color: '#1D9E75' }} />
                  : <X size={32} style={{ color: '#E24B4A' }} />}
              </div>
              <p className="text-xs uppercase tracking-wide font-semibold mb-3" style={{ color: lastAnswer.correct ? '#1D9E75' : '#E24B4A' }}>
                {lastAnswer.correct ? 'Richtig!' : 'Falsch'}
              </p>
              <p className="text-xs text-gray-400 mb-1">{card.front}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{card.back}</p>
              {!lastAnswer.correct && lastAnswer.input && (
                <p className="text-sm mt-2 line-through" style={{ color: '#E24B4A' }}>{lastAnswer.input}</p>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full text-white font-medium py-3 rounded-xl transition-colors cursor-pointer hover:opacity-90"
              style={{ backgroundColor: '#7F77DD' }}
            >
              {index + 1 >= cards.length ? 'Ergebnis ansehen' : 'Weiter →'}
            </button>
          </>
        )}
      </div>

      {confirmLeave && (
        <ConfirmLeaveModal
          onConfirm={() => navigate(`/sets/${id}/study`)}
          onCancel={() => setConfirmLeave(false)}
        />
      )}
    </Layout>
  );
}
