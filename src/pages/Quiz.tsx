import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ConfirmLeaveModal from '../components/ConfirmLeaveModal';
import { useStore } from '../store';
import { shuffle } from '../utils';
import type { Card } from '../types';

type StudyCard = Card & { reversed: boolean };

interface Question {
  card: StudyCard;
  options: string[];
  correct: string;
}

function buildQuestions(cards: Card[], mixed: boolean): Question[] {
  const studyCards: StudyCard[] = cards.map((c) => {
    if (mixed && Math.random() < 0.5) {
      return { id: c.id, front: c.back, back: c.front, reversed: true };
    }
    return { ...c, reversed: false };
  });
  return shuffle(studyCards).map((card) => {
    // Prefer wrong options from cards in the same direction to keep answers consistent
    const sameDir = studyCards.filter((c) => c.id !== card.id && c.reversed === card.reversed);
    const pool = sameDir.length >= 3 ? sameDir : studyCards.filter((c) => c.id !== card.id);
    const wrong = shuffle(pool).slice(0, 3).map((c) => c.back);
    const options = shuffle([card.back, ...wrong]);
    return { card, options, correct: card.back };
  });
}

export default function Quiz() {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => (set ? buildQuestions(set.cards, mixed) : []), [set]);

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ correct: boolean; selected: string; answer: string; front: string }[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);

  if (!set) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-[#888888]">Set nicht gefunden.</p>
          <Link to="/" className="text-sm mt-2 inline-block" style={{ color: '#7F77DD' }}>← Zurück</Link>
        </div>
      </Layout>
    );
  }

  const q = questions[qIndex];
  const progress = ((qIndex) / questions.length) * 100;

  const handleSelect = (option: string) => {
    if (selected !== null) return;
    setSelected(option);

    const correct = option === q.correct;
    setAnswers((prev) => [...prev, { correct, selected: option, answer: q.correct, front: q.card.front }]);
    if (!q.card.reversed) recordCardResult(id!, q.card.id, correct);
  };

  const handleNext = () => {
    if (qIndex + 1 >= questions.length) {
      const correctCount = answers.filter((a) => a.correct).length;
      const finalScore = Math.round((correctCount / questions.length) * 100);

      const prev = getSetProgress(id!);
      updateProgress({
        ...prev,
        setId: id!,
        lastStudied: new Date().toISOString(),
        bestQuizScore: Math.max(prev.bestQuizScore, finalScore),
        totalSessions: prev.totalSessions + 1,
      });

      finishSession('quiz', finalScore);
      markActivity();
      addXp(20 + (correctCount === questions.length ? 50 : 0));

      navigate('/results', {
        state: {
          setId: id,
          setName: set.name,
          mode: 'quiz',
          score: finalScore,
          answers,
          questions: questions.map((q) => ({ front: q.card.front, back: q.card.back })),
        },
      });
    } else {
      setSelected(null);
      setQIndex((i) => i + 1);
    }
  };

  const optionStyle = (option: string) => {
    if (selected === null) {
      return { className: 'border-[#ebebeb] dark:border-[#2a2a2a] hover:border-[#7F77DD]/40 hover:bg-[#7F77DD]/10 cursor-pointer dark:text-white' };
    }
    if (option === q.correct) return {
      className: 'border-2',
      style: { borderColor: 'rgba(29,158,117,0.5)', background: 'rgba(29,158,117,0.09)', color: '#1D9E75' },
    };
    if (option === selected && option !== q.correct) return {
      className: 'border-2',
      style: { borderColor: 'rgba(226,75,74,0.5)', background: 'rgba(226,75,74,0.09)', color: '#E24B4A' },
    };
    return { className: 'border-[#ebebeb] dark:border-[#2a2a2a] text-[#cccccc] dark:text-[#444444]' };
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setConfirmLeave(true)}
            className="text-sm text-[#888888] hover:text-[#555555] dark:hover:text-[#cccccc]"
          >
            ← Zurück
          </button>
          <span className="text-sm text-[#888888]">
            {qIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="w-full bg-[#ebebeb] dark:bg-[#2a2a2a] rounded-full h-1.5 mb-8">
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Quizfortschritt"
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: '#7F77DD' }}
          />
        </div>

        <div className="rounded-2xl p-6 mb-6 text-center border border-[#ebebeb] dark:border-white/10 bg-card">
          <p className="text-xs text-[#888888] mb-3 uppercase tracking-wide">{q.card.reversed ? set.language2 : set.language1}</p>
          <p className="text-2xl font-semibold text-[#111111] dark:text-white">{q.card.front}</p>
          <p className="text-xs text-[#cccccc] dark:text-[#444444] mt-2">Wähle die richtige Übersetzung</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {q.options.map((option) => {
            const { className: optClass, style: optStyle } = optionStyle(option);
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={`border-2 rounded-xl p-4 text-sm font-medium text-left transition-all ${optClass}`}
                style={optStyle}
              >
                {option}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <button
            onClick={handleNext}
            className="w-full text-white font-medium py-3 rounded-xl transition-colors cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#7F77DD' }}
          >
            {qIndex + 1 >= questions.length ? 'Ergebnis ansehen' : 'Weiter →'}
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
