import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, CircleCheck, PackageOpen, Medal, Flame, Download, Upload } from 'lucide-react';
import Layout from '../components/Layout';
import SetCard from '../components/SetCard';
import { useStore } from '../store';
import { getLevelInfo } from '../xp';

type SortOption = 'newest' | 'alpha' | 'studied';

export default function LernenPage() {
  const navigate = useNavigate();
  const sets = useStore((s) => s.sets);
  const user = useStore((s) => s.user);
  const daily = useStore((s) => s.daily);
  const progress = useStore((s) => s.progress);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen]);

  const SORT_LABELS: Record<SortOption, string> = {
    newest: 'Neueste zuerst',
    alpha: 'Alphabetisch',
    studied: 'Zuletzt gelernt',
  };

  const sortedSets = [...sets].sort((a, b) => {
    if (sortBy === 'alpha') return a.name.localeCompare(b.name);
    if (sortBy === 'studied') {
      const pa = progress[a.id]?.lastStudied ?? '';
      const pb = progress[b.id]?.lastStudied ?? '';
      return pb.localeCompare(pa);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const keys = [
      'lernapp_sets', 'lernapp_progress', 'lernapp_user', 'lernapp_cardstats',
      'lernapp_daily', 'lernapp_darkmode', 'mixedMode',
      'lernapp_diary', 'lernapp_tasks', 'lernapp_habits', 'lernapp_notes',
    ];
    const data: Record<string, unknown> = {};
    keys.forEach((key) => {
      const val = localStorage.getItem(key);
      if (val !== null) {
        try { data[key] = JSON.parse(val); } catch { data[key] = val; }
      }
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lernapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Record<string, unknown>;
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        window.location.reload();
      } catch {
        alert('Ungültige Backup-Datei');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const levelInfo = getLevelInfo(user.xp ?? 0);
  const badgeCount = user.earnedBadges.length;
  const activeToday = user.lastActiveDate === new Date().toISOString().slice(0, 10);

  return (
    <Layout>
      {/* Kompakte Stats-Leiste */}
      <div className={`flex items-center bg-card border app-border rounded-xl px-4 py-2.5 gap-0 ${daily?.completed ? 'mb-2' : 'mb-4'}`}>
        {/* Streak */}
        <div className="flex items-center gap-1.5 pr-4 border-r app-border">
          <Flame size={15} style={{ color: activeToday ? '#EF9F27' : '#bbbbbb' }} />
          <span className="text-sm font-semibold" style={{ color: activeToday ? '#EF9F27' : '#bbbbbb' }}>
            {user.streak}
          </span>
          <span className="text-xs" style={{ color: '#888888' }}>Streak</span>
        </div>

        {/* XP / Level */}
        <div className="flex items-center gap-2 px-4 border-r app-border flex-1 min-w-0">
          <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#7F77DD' }}>
            Lvl {levelInfo.level}
          </span>
          <span className="text-xs font-medium whitespace-nowrap hidden sm:inline" style={{ color: '#888888' }}>
            {levelInfo.name}
          </span>
          <div className="w-28 shrink-0 h-1.5 bg-[#ebebeb] dark:bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(levelInfo.progressInLevel * 100)}%`, backgroundColor: '#7F77DD' }}
            />
          </div>
          <span className="text-xs whitespace-nowrap" style={{ color: '#888888' }}>
            {levelInfo.xpForNext !== null
              ? `${levelInfo.xpInCurrentLevel} / ${levelInfo.xpInCurrentLevel + levelInfo.xpForNext} XP`
              : 'Max'}
          </span>
        </div>

        {/* Badges */}
        <Link
          to="/badges"
          className="flex items-center gap-1.5 pl-4 transition-opacity hover:opacity-70"
        >
          <Medal size={14} style={{ color: badgeCount > 0 ? '#7F77DD' : '#bbbbbb' }} />
          <span className="text-sm font-semibold app-text">{badgeCount}</span>
          <span className="text-xs hidden sm:inline" style={{ color: '#888888' }}>Badges</span>
        </Link>
      </div>

      {/* Tages-Herausforderung */}
      {daily && daily.cards.length > 0 && (
        daily.completed ? (
          <div className="flex items-center gap-1.5 text-xs mb-3 px-0.5" style={{ color: '#1D9E75' }}>
            <CircleCheck size={13} className="shrink-0" />
            <span className="flex items-center gap-1 flex-wrap">
              Tägliche Challenge erledigt – {daily.score}%
              {daily.challengeStreak > 1 && (
                <span className="inline-flex items-center gap-0.5 ml-0.5">
                  · <Flame size={11} style={{ color: '#EF9F27' }} /> {daily.challengeStreak} Tage in Folge
                </span>
              )}
            </span>
          </div>
        ) : (
          <div
            className="flex items-center justify-between rounded-xl px-4 py-2.5 mb-5 border"
            style={{ background: 'rgba(29,158,117,0.09)', borderColor: 'rgba(29,158,117,0.22)' }}
          >
            <p className="text-sm flex items-center gap-1.5" style={{ color: '#1D9E75' }}>
              <CalendarDays size={14} className="shrink-0" />
              <span>Tägliche Challenge – {daily.cards.length} Karten</span>
            </p>
            <button
              onClick={() => navigate('/daily')}
              className="shrink-0 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
              style={{ backgroundColor: '#1D9E75' }}
            >
              Starten
            </button>
          </div>
        )
      )}

      {/* Sets */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold app-text">
          Meine Sets{' '}
          {sets.length > 0 && (
            <span className="font-normal text-base" style={{ color: '#888888' }}>({sets.length})</span>
          )}
        </h2>
        {sets.length > 1 && (
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-1 text-xs bg-white dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] rounded-lg px-2.5 py-1.5 hover:border-[#d0d0d0] dark:hover:border-[#3a3a3a] transition-colors cursor-pointer app-text"
            >
              {SORT_LABELS[sortBy]}
              <span style={{ color: '#bbbbbb' }}>▾</span>
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); setSortOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer app-hover ${
                      sortBy === opt ? 'font-semibold app-text' : 'app-text'
                    }`}
                  >
                    {SORT_LABELS[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {sets.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#ebebeb] dark:border-[#2a2a2a] rounded-2xl">
          <PackageOpen size={56} className="mx-auto mb-4" style={{ color: '#bbbbbb' }} />
          <h3 className="text-lg font-semibold app-text mb-2">Noch keine Sets</h3>
          <p className="text-sm mb-6" style={{ color: '#888888' }}>
            Erstelle dein erstes Vokabelset und fang an zu lernen!
          </p>
          <Link
            to="/sets/new"
            className="inline-block font-medium px-6 py-2.5 rounded-lg transition-opacity hover:opacity-80 bg-[#111111] dark:bg-white text-white dark:text-[#111111]"
          >
            Erstes Set erstellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSets.map((set) => (
            <SetCard key={set.id} set={set} />
          ))}
          <Link
            to="/sets/new"
            className="flex flex-col items-center justify-center border-2 border-dashed border-[#ebebeb] dark:border-[#2a2a2a] rounded-xl p-5 transition-all min-h-[160px] hover:border-[#d0d0d0] dark:hover:border-[#3a3a3a]"
            style={{ color: '#888888' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
          >
            <span className="text-3xl mb-2">+</span>
            <span className="text-sm font-medium">Neues Set</span>
          </Link>
        </div>
      )}
      {sets.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-8 pt-6 border-t border-[#ebebeb] dark:border-[#2a2a2a]">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
            style={{ color: '#888888' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
          >
            <Download size={13} /> Daten exportieren
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="flex items-center gap-1.5 text-xs transition-colors cursor-pointer"
            style={{ color: '#888888' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
          >
            <Upload size={13} /> Daten importieren
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      )}
    </Layout>
  );
}
