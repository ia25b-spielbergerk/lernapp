import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Check, CreditCard } from 'lucide-react';
import Layout from '../components/Layout';
import ConfirmLeaveModal from '../components/ConfirmLeaveModal';
import { useStore } from '../store';
import { shuffle } from '../utils';

export default function Flashcards() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const weakOnly: boolean = location.state?.weakOnly ?? false;
  const weakCardIds: string[] = location.state?.weakCardIds ?? [];
  const mixed: boolean = location.state?.mixed ?? false;
  const sets = useStore((s) => s.sets);
  const markActivity = useStore((s) => s.markActivity);
  const addStudiedCards = useStore((s) => s.addStudiedCards);
  const recordCardResult = useStore((s) => s.recordCardResult);
  const addXp = useStore((s) => s.addXp);

  const set = sets.find((s) => s.id === id);
  type StudyCard = NonNullable<typeof set>['cards'][number] & { reversed: boolean };
  const [cards] = useState<StudyCard[]>(() => {
    if (!set) return [];
    const all = set.cards;
    let source = all;
    if (weakOnly && weakCardIds.length > 0) {
      const filtered = all.filter((c) => weakCardIds.includes(c.id));
      source = filtered.length > 0 ? filtered : all;
    }
    const withDir: StudyCard[] = source.map((c) => {
      if (mixed && Math.random() < 0.5) {
        return { id: c.id, front: c.back, back: c.front, reversed: true };
      }
      return { ...c, reversed: false };
    });
    return shuffle(withDir);
  });
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [done, setDone] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Karte automatisch fokussieren beim Start und nach jedem Kartenwechsel
  useEffect(() => {
    cardRef.current?.focus();
  }, [index]);

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

  const card = cards[index];
  const progress = ((index) / cards.length) * 100;

  const handleAnswer = (wasKnown: boolean) => {
    if (wasKnown) setKnown((k) => k + 1);
    else setUnknown((u) => u + 1);

    if (!card.reversed) recordCardResult(id!, card.id, wasKnown);
    addStudiedCards(1);

    if (index + 1 >= cards.length) {
      markActivity();
      addXp(10 + (wasKnown ? 5 : 0));
      setDone(true);
    } else {
      setFlipped(false);
      setTimeout(() => setIndex((i) => i + 1), 150);
    }
  };

  if (done) {
    const total = known + unknown;
    const pct = Math.round((known / total) * 100);
    return (
      <Layout>
        <div className="max-w-md mx-auto text-center py-12">
          <CreditCard size={56} className="mx-auto mb-4" style={{ color: '#7F77DD' }} />
          <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-2">
            {weakOnly ? 'Schwache Karten geübt!' : 'Fertig!'}
          </h1>
          <p className="text-[#888888] text-sm mb-8">{total} Karten durchgegangen</p>

          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: '#1D9E75' }}>{known}</p>
              <p className="text-sm text-[#888888]">Gewusst</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold" style={{ color: '#E24B4A' }}>{unknown}</p>
              <p className="text-sm text-[#888888]">Nicht gewusst</p>
            </div>
          </div>

          <div className="w-full bg-[#ebebeb] dark:bg-white/10 rounded-full h-2 mb-8">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: '#1D9E75' }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/sets/${id}/study`)}
              className="flex-1 border border-[#ebebeb] dark:border-[#2a2a2a] text-[#555555] dark:text-[#888888] hover:bg-[#f0f0f0] dark:hover:bg-[#222222] font-medium py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
            >
              Zurück
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 text-white font-medium py-2.5 rounded-lg transition-colors text-sm hover:opacity-90"
              style={{ backgroundColor: '#7F77DD' }}
            >
              Startseite
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setConfirmLeave(true)}
            className="text-sm text-[#888888] hover:text-[#555555] dark:hover:text-[#cccccc]"
          >
            ← Zurück
          </button>
          <span className="text-sm text-[#888888]">
            {index + 1} / {cards.length}
          </span>
        </div>

        {/* Fortschrittsbalken */}
        <div className="w-full bg-[#ebebeb] dark:bg-[#2a2a2a] rounded-full h-1.5 mb-8">
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Lernfortschritt"
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, backgroundColor: '#7F77DD' }}
          />
        </div>

        {/* Karte */}
        <div
          ref={cardRef}
          onClick={() => setFlipped((f) => !f)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={flipped ? `Rückseite: ${card.back}. Enter oder Leertaste zum Umdrehen` : `Vorderseite: ${card.front}. Enter oder Leertaste zum Umdrehen`}
          aria-pressed={flipped}
          className="cursor-pointer select-none"
          style={{ perspective: '1000px' }}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: '220px',
            }}
          >
            {/* Vorderseite */}
            <div
              className="absolute inset-0 rounded-2xl shadow-sm border-2 border-[#ebebeb] dark:border-white/10 bg-card"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <p className="text-xs text-[#888888] mb-4 uppercase tracking-wide">{card.reversed ? set.language2 : set.language1}</p>
                <p className="text-2xl font-semibold text-[#111111] dark:text-white text-center">{card.front}</p>
                <p className="text-xs text-[#cccccc] dark:text-[#444444] mt-6">Tippen zum Umdrehen</p>
              </div>
            </div>

            {/* Rückseite */}
            <div
              className="absolute inset-0 rounded-2xl shadow-sm border-2"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                backgroundColor: '#7F77DD',
                borderColor: '#7F77DD',
              }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <p className="text-xs text-white/60 mb-4 uppercase tracking-wide">{card.reversed ? set.language1 : set.language2}</p>
                <p className="text-2xl font-semibold text-white text-center">{card.back}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleAnswer(false)}
            className="flex-1 font-medium py-3 rounded-xl transition-all border-2 cursor-pointer hover:opacity-90"
            style={{ borderColor: 'rgba(226,75,74,0.35)', color: '#E24B4A', background: 'rgba(226,75,74,0.07)' }}
          >
            Nicht gewusst
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex-1 font-medium py-3 rounded-xl transition-all border-2 cursor-pointer hover:opacity-90"
            style={{ borderColor: 'rgba(29,158,117,0.35)', color: '#1D9E75', background: 'rgba(29,158,117,0.07)' }}
          >
            Gewusst <Check size={16} className="inline" />
          </button>
        </div>

        {!flipped && (
          <p className="text-center text-[#cccccc] dark:text-[#444444] text-sm mt-6">
            Karte anklicken um die Antwort zu sehen
          </p>
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
