import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Trophy, Award, TrendingUp, BookOpen } from 'lucide-react';
import Layout from '../components/Layout';

interface ResultAnswer {
  correct: boolean;
  selected: string;
  answer: string;
  front?: string;
}

interface ResultState {
  setId: string;
  setName: string;
  mode: 'quiz' | 'test';
  score: number;
  answers: ResultAnswer[];
}

function ScoreCircle({ score }: { score: number }) {
  // Green=80+ · Orange=50-79 (warning) · Red=<50
  const color = score >= 80 ? '#1D9E75' : score >= 50 ? '#EF9F27' : '#E24B4A';
  const ScoreIcon = score === 100 ? Trophy : score >= 80 ? Award : score >= 50 ? TrendingUp : BookOpen;

  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-3">
        <ScoreIcon size={52} style={{ color }} />
      </div>
      <p className="text-6xl font-bold" style={{ color }}>{score}%</p>
      <p className="text-gray-400 dark:text-white/40 text-sm mt-2">
        {score === 100 ? 'Perfekt! Alle richtig!' : score >= 80 ? 'Super gemacht!' : score >= 50 ? 'Gut, weiter üben!' : 'Noch etwas Übung nötig'}
      </p>
    </div>
  );
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultState | null;

  useEffect(() => {
    if (!state) navigate('/', { replace: true });
  }, [state, navigate]);

  if (!state) return null;

  const correct = state.answers.filter((a) => a.correct).length;
  const wrong = state.answers.filter((a) => !a.correct);

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="mb-4">
          <Link to={`/sets/${state.setId}/study`} className="text-sm text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/60">
            ← Zurück zu "{state.setName}"
          </Link>
        </div>

        <ScoreCircle score={state.score} />

        {/* Statistik */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center bg-white dark:bg-white/5 border border-gray-100 dark:border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{state.answers.length}</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Fragen</p>
          </div>
          <div className="text-center rounded-xl p-4 border" style={{ background: 'rgba(29,158,117,0.09)', borderColor: 'rgba(29,158,117,0.22)' }}>
            <p className="text-2xl font-bold" style={{ color: '#1D9E75' }}>{correct}</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Richtig</p>
          </div>
          <div className="text-center rounded-xl p-4 border" style={{ background: 'rgba(226,75,74,0.09)', borderColor: 'rgba(226,75,74,0.22)' }}>
            <p className="text-2xl font-bold" style={{ color: '#E24B4A' }}>{wrong.length}</p>
            <p className="text-xs text-gray-400 dark:text-white/40 mt-1">Falsch</p>
          </div>
        </div>

        {/* Falsche Antworten */}
        {wrong.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-white/70 mb-3">Noch zu lernen:</h2>
            <div className="space-y-2">
              {wrong.map((a, i) => (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3 flex items-center justify-between gap-4 border"
                  style={{ background: 'rgba(226,75,74,0.07)', borderColor: 'rgba(226,75,74,0.18)' }}
                >
                  <div>
                    {a.front && <p className="text-xs text-gray-400 dark:text-white/40 mb-0.5">{a.front}</p>}
                    <p className="text-sm line-through" style={{ color: '#E24B4A' }}>{a.selected}</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0" style={{ color: '#1D9E75' }}>→ {a.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aktionen */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/sets/${state.setId}/${state.mode}`)}
            className="flex-1 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5 font-medium py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
          >
            Nochmal
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 text-white font-medium py-2.5 rounded-lg transition-opacity hover:opacity-80 text-sm cursor-pointer"
            style={{ backgroundColor: '#7F77DD' }}
          >
            Startseite
          </button>
        </div>
      </div>
    </Layout>
  );
}
