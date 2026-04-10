import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import Layout from '../components/Layout';
import ConfirmLeaveModal from '../components/ConfirmLeaveModal';
import { useStore } from '../store';
import { shuffle, isCloseEnough } from '../utils';
import type { Card } from '../types';

type StudyCard = Card & { reversed: boolean };

interface Answer {
  card: StudyCard;
  input: string;
  correct: boolean;
  almostCorrect: boolean;
}

export default function TestMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const mixed: boolean = location.state?.mixed ?? false;
  const sets = useStore((s) => s.sets);
  const updateProgress = useStore((s) => s.updateProgress);
  const getSetProgress = useStore((s) => s.getSetProgress);
  const markActivity = useStore((s) => s.markActivity);
  const finishSession = useStore((s) => s.finishSession);
  const recordCardResult = useStore((s) => s.recordCardResult);
  const addXp = useStore((s) => s.addXp);

  const set = sets.find((s) => s.id === id);
  const [cards] = useState<StudyCard[]>(() => {
    if (!set) return [];
    return shuffle(set.cards.map((c) => {
      if (mixed && Math.random() < 0.5) {
        return { id: c.id, front: c.back, back: c.front, reversed: true };
      }
      return { ...c, reversed: false };
    }));
  });
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!submitted) inputRef.current?.focus();
  }, [index, submitted]);

  if (!set) {
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
  const progress = (index / cards.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitted) return;

    const correct = isCloseEnough(input, card.back);
    const exact = input.trim().toLowerCase() === card.back.trim().toLowerCase();
    const almostCorrect = correct && !exact;

    setAnswers((prev) => [...prev, { card, input, correct, almostCorrect }]);
    if (!card.reversed) recordCardResult(id!, card.id, correct);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (index + 1 >= cards.length) {
      const allAnswers = answers;
      const correctCount = allAnswers.filter((a) => a.correct).length;
      const finalScore = Math.round((correctCount / cards.length) * 100);

      const prev = getSetProgress(id!);
      updateProgress({
        ...prev,
        setId: id!,
        lastStudied: new Date().toISOString(),
        bestTestScore: Math.max(prev.bestTestScore, finalScore),
        totalSessions: prev.totalSessions + 1,
      });

      finishSession('test', finalScore);
      markActivity();
      addXp(20 + (finalScore === 100 ? 50 : 0));

      navigate('/results', {
        state: {
          setId: id,
          setName: set.name,
          mode: 'test',
          score: finalScore,
          answers: allAnswers.map((a) => ({
            correct: a.correct,
            selected: a.input,
            answer: a.card.back,
            front: a.card.front,
          })),
        },
      });
    } else {
      setInput('');
      setSubmitted(false);
      setIndex((i) => i + 1);
    }
  };

  const lastAnswer = submitted ? answers[answers.length - 1] : null;
  const isCorrect = lastAnswer?.correct ?? false;
  const isAlmost = lastAnswer?.almostCorrect ?? false;

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
          <span className="text-sm text-gray-400">
            {index + 1} / {cards.length}
          </span>
        </div>

        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-8">
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Testfortschritt"
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: '#7F77DD' }}
          />
        </div>

        <div className="rounded-2xl p-6 mb-6 text-center border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">{card.reversed ? set.language2 : set.language1}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{card.front}</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide">
            {set.language2}
          </label>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={submitted}
            placeholder={`Übersetzung auf ${set.language2}...`}
            className={`w-full border-2 rounded-xl px-4 py-3 text-base focus:outline-none transition-colors bg-white dark:bg-gray-800 ${
              submitted
                ? isCorrect
                  ? 'border-[#1D9E75] text-[#1D9E75]'
                  : 'border-[#E24B4A] text-[#E24B4A]'
                : 'border-gray-200 dark:border-gray-700 dark:text-gray-100 focus:border-[#7F77DD]'
            }`}
          />

          {!submitted && (
            <>
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-full mt-3 disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium py-3 rounded-xl transition-colors cursor-pointer"
                style={input.trim() ? { backgroundColor: '#7F77DD' } : undefined}
              >
                Prüfen
              </button>
              <p className="text-center text-xs text-gray-300 dark:text-gray-600 mt-2">Kleine Tippfehler werden akzeptiert</p>
            </>
          )}
        </form>

        {submitted && (
          <div
            className="rounded-xl p-4 mb-4 border"
            style={isCorrect
              ? { background: 'rgba(29,158,117,0.09)', borderColor: 'rgba(29,158,117,0.22)' }
              : { background: 'rgba(226,75,74,0.09)', borderColor: 'rgba(226,75,74,0.22)' }
            }
          >
            {isCorrect ? (
              <div className="flex items-center gap-2">
                <Check size={18} style={{ color: '#1D9E75' }} className="shrink-0" />
                <p className="font-medium text-sm" style={{ color: '#1D9E75' }}>
                  {isAlmost ? `Fast! Richtige Antwort: "${card.back}"` : 'Richtig!'}
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
        )}

        {submitted && (
          <button
            onClick={handleNext}
            className="w-full text-white font-medium py-3 rounded-xl transition-colors cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#7F77DD' }}
          >
            {index + 1 >= cards.length ? 'Ergebnis ansehen' : 'Weiter →'}
          </button>
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
