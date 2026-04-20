import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame, Gem, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle,
  CircleCheck, CalendarDays, ChevronRight, Quote, Check,
  BookOpen, Plus, Repeat2, ArrowRight, Settings, Zap,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useStore } from '../store';
import { useAuth, getInitials } from '../lib/AuthContext';

// Orange=#EF9F27 · Blue=#378ADD · Green=#1D9E75 · Purple=#7F77DD · Red=#E24B4A

const QUOTES = [
  'Der Weg von tausend Meilen beginnt mit einem einzigen Schritt.',
  'Bildung ist die mächtigste Waffe, um die Welt zu verändern.',
  'Wer aufhört zu lernen, ist alt. Wer weiterlernt, bleibt jung.',
  'Es ist nicht genug zu wissen, man muss auch anwenden.',
  'Der beste Zeitpunkt zu pflanzen war vor zwanzig Jahren. Der zweitbeste ist jetzt.',
  'Erfolg ist die Summe kleiner Anstrengungen, die täglich wiederholt werden.',
  'Du musst nicht schnell sein – du musst nur nicht aufhören.',
  'Disziplin ist die Brücke zwischen Zielen und Leistung.',
  'Wachstum beginnt dort, wo die Komfortzone endet.',
  'Der Unterschied zwischen Möglich und Unmöglich liegt in deiner Entschlossenheit.',
  'Kleine Fortschritte sind immer noch Fortschritte.',
  'Was immer der Geist begreifen und glauben kann, das kann er auch erreichen.',
  'Das Geheimnis des Vorwärtskommens ist, anzufangen.',
  'Jeder Experte war einmal ein Anfänger.',
  'Wiederholung ist die Mutter des Lernens.',
  'Setze deine Energie auf das, was du kontrollieren kannst.',
  'Glaube an den Prozess, nicht nur an das Ergebnis.',
  'Der Unterschied zwischen heute und morgen liegt in dem, was du jetzt tust.',
  'Lerne, als ob du ewig leben würdest.',
  'Jeder Tag ist eine neue Chance, eine bessere Version von dir zu werden.',
  'Durchhalten ist keine Glückssache – es ist eine Entscheidung.',
  'Was du heute lernst, trägt morgen Früchte.',
  'Die Kraft liegt nicht im Können, sondern im Wollen.',
  'Perfektion ist nicht das Ziel – Fortschritt ist es.',
  'Jede Meisterschaft beginnt mit der Entscheidung, es zu versuchen.',
];

function getDailyQuote(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}

// ── Wetter ───────────────────────────────────────────────────────────────────

interface WeatherData { temp: string; code: number; }

function getWeatherIcon(code: number) {
  if (code === 113 || code === 116) return Sun;
  if ([200, 201, 202, 230, 231, 232].includes(code)) return CloudLightning;
  if (code >= 293 && code <= 314) return CloudRain;
  if (code >= 317 && code <= 395) return CloudSnow;
  if ([176, 177, 179, 182, 185, 263, 266].includes(code)) return CloudDrizzle;
  return Cloud;
}

function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://wttr.in/Zürich?format=j1')
      .then((r) => r.json())
      .then((data) => {
        const c = data.current_condition?.[0];
        if (c) setWeather({ temp: c.temp_C, code: Number(c.weatherCode) });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-1.5 animate-pulse">
      <div className="w-4 h-4 rounded bg-[#ebebeb] dark:bg-[#2a2a2a]" />
      <div className="w-12 h-3 rounded bg-[#ebebeb] dark:bg-[#2a2a2a]" />
    </div>
  );
  if (!weather) return null;

  const Icon = getWeatherIcon(weather.code);
  return (
    <div className="flex items-center gap-1.5" style={{ color: '#888888' }}>
      <Icon size={16} />
      <span className="text-sm font-medium">{weather.temp}°C</span>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 11) return 'Guten Morgen';
  if (hour >= 11 && hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const user = useStore((s) => s.user);
  const daily = useStore((s) => s.daily);
  const tasks = useStore((s) => s.tasks);
  const habits = useStore((s) => s.habits);
  const sets = useStore((s) => s.sets);
  const cardStats = useStore((s) => s.cardStats);
  const checkInHabit = useStore((s) => s.checkInHabit);
  const completeTask = useStore((s) => s.completeTask);

  const isNewUser = sets.length === 0 && habits.length === 0 && tasks.length === 0;

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const activeToday = user.lastActiveDate === today;
  const quote = useMemo(() => getDailyQuote(), []);

  const todayTasks = useMemo(() => tasks.filter((t) => {
    if (t.recurring === 'täglich') return true;
    if (t.recurring === 'wöchentlich') {
      const dow = now.getDay();
      const sow = new Date(now);
      sow.setDate(sow.getDate() - dow);
      const sowStr = sow.toISOString().slice(0, 10);
      return !t.completedDates.some((d) => d >= sowStr && d <= today);
    }
    return t.date === today;
  }), [tasks, today]);

  const isTaskDone = (t: typeof tasks[number]) =>
    t.recurring ? t.completedDates.includes(today) : t.completed;

  const previewTasks = [...todayTasks.filter((t) => !isTaskDone(t))]
    .sort((a, b) => ({ hoch: 0, mittel: 1, niedrig: 2 }[a.priority] - { hoch: 0, mittel: 1, niedrig: 2 }[b.priority]))
    .slice(0, 3);

  // ── Tagesstatistik ─────────────────────────────────────────────────────────
  const todayCardStats = useMemo(() => {
    const flat = Object.values(cardStats).flatMap((s) => Object.values(s));
    return flat.filter((s) => new Date(s.lastSeen).toISOString().slice(0, 10) === today);
  }, [cardStats, today]);

  const xpToday = todayCardStats.length * 10;
  const sessionsToday = new Set(todayCardStats.map((s) => s.setId)).size;
  const habitsDoneToday = habits.filter((h) => h.checkIns.includes(today)).length;

  const PRIORITY_DOT: Record<string, string> = {
    hoch: 'bg-[#E24B4A]',
    mittel: 'bg-[#EF9F27]',
    niedrig: 'bg-[#1D9E75]',
  };

  return (
    <Layout>
      {/* Datum + Wetter + Einstellungen */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-2xl font-bold app-text">
            {WEEKDAYS[now.getDay()]}, {now.getDate()}. {MONTHS[now.getMonth()]}
          </p>
          <p className="text-sm mt-0.5" style={{ color: '#888888' }}>
            {getGreeting(now.getHours())}{profile?.username ? `, ${profile.username}` : ''}!
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <WeatherWidget />
          <Link
            to="/settings"
            className="transition-colors"
            style={{ color: '#888888' }}
            aria-label="Einstellungen"
          >
            <Settings size={18} />
          </Link>
          <Link
            to="/profil"
            aria-label="Mein Profil"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold hover:opacity-80 transition-opacity"
              style={{ backgroundColor: profile?.avatar_color ?? '#7F77DD' }}
            >
              {profile?.username ? getInitials(profile.username) || '?' : '?'}
            </div>
          </Link>
        </div>
      </div>

      {/* Getting-Started — nur für neue Nutzer */}
      {isNewUser && (
        <div className="mb-5 rounded-2xl border p-5" style={{ background: 'rgba(127,119,221,0.06)', borderColor: 'rgba(127,119,221,0.2)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#7F77DD' }}>
            Erste Schritte
          </p>
          <h2 className="text-lg font-bold app-text mb-1">
            Bereit loszulegen?
          </h2>
          <p className="text-sm mb-4 leading-relaxed" style={{ color: '#888888' }}>
            Erstelle dein erstes Vokabelset und fang noch heute an zu lernen.
          </p>
          <Link
            to="/sets/new"
            className="flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity mb-3 bg-[#111111] dark:bg-white text-white dark:text-[#111111]"
          >
            <BookOpen size={16} /> Erstes Set erstellen <ArrowRight size={15} />
          </Link>
          <div className="flex gap-2">
            <Link
              to="/planer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors"
              style={{ color: '#1D9E75', borderColor: 'rgba(29,158,117,0.3)', background: 'rgba(29,158,117,0.07)' }}
            >
              <Plus size={13} /> Aufgabe
            </Link>
            <Link
              to="/gewohnheiten"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors"
              style={{ color: '#EF9F27', borderColor: 'rgba(239,159,39,0.3)', background: 'rgba(239,159,39,0.07)' }}
            >
              <Repeat2 size={13} /> Gewohnheit
            </Link>
          </div>
        </div>
      )}

      {/* Streak + Kristalle */}
      <div className="flex gap-3 mb-5">
        {/* Streak — Orange */}
        <div
          className="flex-1 flex items-center gap-2.5 rounded-xl px-4 py-3 border"
          style={{ background: 'rgba(239,159,39,0.09)', borderColor: 'rgba(239,159,39,0.22)' }}
        >
          <Flame size={20} style={{ color: activeToday ? '#EF9F27' : 'rgba(239,159,39,0.3)' }} />
          <div>
            <p className="text-xl font-bold leading-none" style={{ color: activeToday ? '#EF9F27' : 'rgba(239,159,39,0.4)' }}>
              {user.streak}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#888888' }}>Tage Streak</p>
          </div>
        </div>
        {/* Kristalle — Blau */}
        <div
          className="flex-1 flex items-center gap-2.5 rounded-xl px-4 py-3 border"
          style={{ background: 'rgba(55,138,221,0.09)', borderColor: 'rgba(55,138,221,0.22)' }}
        >
          <Gem size={20} style={{ color: '#378ADD' }} />
          <div>
            <p className="text-xl font-bold leading-none" style={{ color: '#378ADD' }}>
              {user.crystals ?? 0}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#888888' }}>Kristalle</p>
          </div>
        </div>
      </div>

      {/* Daily Challenge — Grün */}
      {daily && daily.cards.length > 0 && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3 mb-4 border"
          style={
            daily.completed
              ? { background: 'rgba(29,158,117,0.09)', borderColor: 'rgba(29,158,117,0.22)' }
              : { background: 'rgba(29,158,117,0.09)', borderColor: 'rgba(29,158,117,0.22)' }
          }
        >
          <div className="flex items-center gap-2.5">
            {daily.completed
              ? <CircleCheck size={18} style={{ color: '#1D9E75' }} className="shrink-0" />
              : <CalendarDays size={18} style={{ color: '#1D9E75' }} className="shrink-0" />
            }
            <div>
              <p className="text-sm font-medium" style={{ color: '#1D9E75' }}>Tägliche Challenge</p>
              <p className="text-xs" style={{ color: '#888888' }}>
                {daily.completed ? `Erledigt · ${daily.score}%` : `${daily.cards.length} Karten warten`}
              </p>
            </div>
          </div>
          {!daily.completed && (
            <button
              onClick={() => navigate('/daily')}
              className="shrink-0 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
              style={{ backgroundColor: '#1D9E75' }}
            >
              Starten
            </button>
          )}
        </div>
      )}

      {/* Tagesstatistik */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div
          className="rounded-xl px-3 py-2.5 border"
          style={{ background: 'rgba(127,119,221,0.07)', borderColor: 'rgba(127,119,221,0.18)' }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Zap size={11} style={{ color: '#7F77DD' }} />
            <p className="text-[10px]" style={{ color: '#888888' }}>XP heute</p>
          </div>
          <p className="text-lg font-bold leading-none" style={{ color: '#7F77DD' }}>{xpToday}</p>
        </div>
        <div
          className="rounded-xl px-3 py-2.5 border"
          style={{ background: 'rgba(127,119,221,0.07)', borderColor: 'rgba(127,119,221,0.18)' }}
        >
          <div className="flex items-center gap-1 mb-1">
            <BookOpen size={11} style={{ color: '#7F77DD' }} />
            <p className="text-[10px]" style={{ color: '#888888' }}>Sessions</p>
          </div>
          <p className="text-lg font-bold leading-none" style={{ color: '#7F77DD' }}>{sessionsToday}</p>
        </div>
        <div
          className="rounded-xl px-3 py-2.5 border"
          style={{ background: 'rgba(239,159,39,0.07)', borderColor: 'rgba(239,159,39,0.18)' }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Repeat2 size={11} style={{ color: '#EF9F27' }} />
            <p className="text-[10px]" style={{ color: '#888888' }}>Habits</p>
          </div>
          <p className="text-lg font-bold leading-none" style={{ color: '#EF9F27' }}>
            {habitsDoneToday}<span className="text-xs font-normal opacity-50">/{habits.length}</span>
          </p>
        </div>
      </div>

      {/* Heutige Tasks */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold app-text">Heutige Aufgaben</h2>
          <Link to="/planer" className="flex items-center gap-0.5 text-xs transition-opacity hover:opacity-70" style={{ color: '#1D9E75' }}>
            Alle <ChevronRight size={13} />
          </Link>
        </div>
        <div className="bg-card border app-border rounded-xl overflow-hidden">
          {previewTasks.length === 0 ? (
            <p className="text-xs px-4 py-3 text-center" style={{ color: '#888888' }}>
              {todayTasks.filter(isTaskDone).length === todayTasks.length && todayTasks.length > 0
                ? 'Alle Aufgaben erledigt!'
                : 'Keine Aufgaben für heute'}
            </p>
          ) : (
            previewTasks.map((task, i) => (
              <button
                key={task.id}
                onClick={() => completeTask(task.id, today)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left app-hover transition-colors cursor-pointer ${
                  i < previewTasks.length - 1 ? 'border-b app-border' : ''
                }`}
              >
                <div className="w-4 h-4 rounded-full border-2 border-[#d0d0d0] dark:border-[#3a3a3a] shrink-0" />
                <span className="flex-1 text-sm app-text truncate">{task.title}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Heutige Habits — Orange */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold app-text">Gewohnheiten heute</h2>
          <Link to="/gewohnheiten" className="flex items-center gap-0.5 text-xs transition-opacity hover:opacity-70" style={{ color: '#EF9F27' }}>
            Alle <ChevronRight size={13} />
          </Link>
        </div>
        <div className="bg-card border app-border rounded-xl overflow-hidden">
          {habits.length === 0 ? (
            <p className="text-xs px-4 py-3 text-center" style={{ color: '#888888' }}>Noch keine Gewohnheiten angelegt</p>
          ) : (
            habits.map((habit, i) => {
              const done = habit.checkIns.includes(today);
              return (
                <button
                  key={habit.id}
                  onClick={() => checkInHabit(habit.id, today)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left app-hover transition-colors cursor-pointer ${
                    i < habits.length - 1 ? 'border-b app-border' : ''
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
                    style={done
                      ? { borderColor: '#1D9E75', backgroundColor: '#1D9E75' }
                      : { borderColor: 'rgba(239,159,39,0.4)' }
                    }
                  >
                    {done && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <span className={`flex-1 text-sm truncate transition-colors ${done ? 'line-through' : 'app-text'}`}
                        style={done ? { color: '#888888' } : undefined}>
                    {habit.name}
                  </span>
                  {habit.streak > 0 && (
                    <span className="flex items-center gap-0.5 text-xs shrink-0" style={{ color: '#EF9F27' }}>
                      <Flame size={11} /> {habit.streak}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Tageszitat */}
      <div className="flex gap-3 bg-card border app-border rounded-xl px-4 py-3">
        <Quote size={16} className="shrink-0 mt-0.5" style={{ color: '#bbbbbb' }} />
        <p className="text-xs italic leading-relaxed" style={{ color: '#888888' }}>{quote}</p>
      </div>
    </Layout>
  );
}
