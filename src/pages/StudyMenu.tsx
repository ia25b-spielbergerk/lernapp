import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, Target, PenLine, Zap, Shuffle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Layout from '../components/Layout';
import { useStore } from '../store';

interface ModeOption {
  key: 'flashcards' | 'quiz' | 'test' | 'blitz';
  icon: LucideIcon;
  title: string;
  description: string;
  minCards: number;
}

const MODES: ModeOption[] = [
  { key: 'flashcards', icon: CreditCard, title: 'Karteikarten', description: 'Karten einzeln durchgehen und selbst einschätzen', minCards: 1 },
  { key: 'quiz',       icon: Target,     title: 'Quiz',          description: 'Multiple-Choice mit 4 Antworten',                    minCards: 4 },
  { key: 'test',       icon: PenLine,    title: 'Test',          description: 'Antwort selbst eintippen',                           minCards: 1 },
  { key: 'blitz',      icon: Zap,        title: 'Blitz-Modus',   description: 'Karte 3 Sekunden einprägen, dann aus dem Gedächtnis tippen', minCards: 1 },
];

export default function StudyMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sets = useStore((s) => s.sets);
  const rawProgress = useStore((s) => s.progress[id ?? '']);
  const progress = rawProgress ?? { setId: id ?? '', lastStudied: 0, bestQuizScore: 0, bestTestScore: 0, totalSessions: 0 };
  const getWeakCardIds = useStore((s) => s.getWeakCardIds);

  const [mixed, setMixed] = useState(() => localStorage.getItem('mixedMode') === 'true');

  const toggleMixed = () => setMixed((m) => {
    const next = !m;
    localStorage.setItem('mixedMode', String(next));
    return next;
  });

  const set = sets.find((s) => s.id === id);
  const weakCardIds = id ? getWeakCardIds(id) : [];

  if (!set) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-400">Set nicht gefunden.</p>
          <Link to="/lernen" className="text-sm mt-2 inline-block" style={{ color: '#7F77DD' }}>← Zurück</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <Link to="/lernen" className="text-sm text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60 mb-6 inline-block">
          ← Zurück
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{set.name}</h1>
          <p className="text-gray-400 dark:text-white/40 text-sm mt-1">
            {set.language1} → {set.language2} · {set.cards.length} Karten
          </p>

          {(progress.bestQuizScore > 0 || progress.bestTestScore > 0) && (
            <div className="flex gap-4 mt-3">
              {progress.bestQuizScore > 0 && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(127,119,221,0.12)', color: '#7F77DD' }}>
                  Quiz: {progress.bestQuizScore}%
                </span>
              )}
              {progress.bestTestScore > 0 && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}>
                  Test: {progress.bestTestScore}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Schwache Karten Banner — Orange */}
        {weakCardIds.length > 0 && (
          <div
            className="rounded-xl p-4 mb-6 flex items-center justify-between gap-3 border"
            style={{ background: 'rgba(239,159,39,0.09)', borderColor: 'rgba(239,159,39,0.22)' }}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: '#EF9F27' }}>
                {weakCardIds.length} {weakCardIds.length === 1 ? 'Karte' : 'Karten'} zum Üben
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(239,159,39,0.7)' }}>
                Diese Karten hast du öfter falsch beantwortet
              </p>
            </div>
            <button
              onClick={() => navigate(`/sets/${id}/flashcards`, { state: { weakOnly: true, weakCardIds, mixed } })}
              className="shrink-0 text-white text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
              style={{ backgroundColor: '#EF9F27' }}
            >
              Jetzt üben
            </button>
          </div>
        )}

        {/* Beide Richtungen Toggle — Violett */}
        <button
          onClick={toggleMixed}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border mb-5 transition-all text-left bg-white dark:bg-white/5"
          style={mixed
            ? { borderColor: 'rgba(127,119,221,0.35)', background: 'rgba(127,119,221,0.07)' }
            : { borderColor: undefined }
          }
        >
          <div className="flex items-center gap-3">
            <Shuffle size={18} style={{ color: mixed ? '#7F77DD' : undefined }} className={!mixed ? 'text-gray-400 dark:text-white/30' : ''} />
            <div>
              <p className="text-sm font-semibold" style={mixed ? { color: '#7F77DD' } : undefined}>
                {!mixed && <span className="text-gray-900 dark:text-white">Beide Richtungen</span>}
                {mixed && 'Beide Richtungen'}
              </p>
              <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
                {set.language1} → {set.language2} und {set.language2} → {set.language1} gemischt
              </p>
            </div>
          </div>
          <div
            className="relative w-10 h-6 rounded-full transition-colors shrink-0"
            style={{ backgroundColor: mixed ? '#7F77DD' : undefined }}
            data-mixed={mixed}
          >
            <div className="relative w-10 h-6 rounded-full bg-gray-200 dark:bg-white/15 transition-colors" style={mixed ? { backgroundColor: '#7F77DD' } : {}}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${mixed ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </button>

        <h2 className="text-sm font-medium text-gray-500 dark:text-white/40 uppercase tracking-wide mb-3">
          Lernmodus wählen
        </h2>

        <div className="space-y-3">
          {MODES.map((mode) => {
            const disabled = set.cards.length < mode.minCards;
            return (
              <button
                key={mode.key}
                onClick={() => !disabled && navigate(`/sets/${id}/${mode.key}`, { state: { mixed } })}
                disabled={disabled}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all bg-white dark:bg-white/5 ${
                  disabled
                    ? 'border-gray-100 dark:border-white/8 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 dark:border-white/10 hover:border-[#7F77DD]/40 hover:shadow-sm cursor-pointer'
                }`}
              >
                <mode.icon size={24} className="shrink-0" style={{ color: '#7F77DD' }} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{mode.title}</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">{mode.description}</p>
                  {disabled && (
                    <p className="text-xs mt-0.5" style={{ color: '#E24B4A' }}>
                      Mindestens {mode.minCards} Karten nötig
                    </p>
                  )}
                </div>
                <span className="text-gray-300 dark:text-white/20 text-lg">›</span>
              </button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
