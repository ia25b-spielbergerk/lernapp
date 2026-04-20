import { useState, useMemo } from 'react';
import type { ReactNode, ElementType } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart2, BookOpen, Repeat2, CalendarDays, ListChecks, Flame } from 'lucide-react';
import { useStore } from '../store';

type Period = '7' | '30';

function getDates(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

function fmtLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr + 'T12:00:00');
  if (period === '7') return d.toLocaleDateString('de-DE', { weekday: 'short' });
  const day = d.getDate();
  const month = d.getMonth() + 1;
  return `${day}.${month}.`;
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Schlecht', 2: 'Okay', 3: 'Gut', 4: 'Sehr gut', 5: 'Perfekt',
};

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-gray-300 dark:text-white/20 text-center">
      {text}
    </div>
  );
}

function SectionCard({ children, title, icon: Icon, color }: {
  children: ReactNode;
  title: string;
  icon: ElementType;
  color: string;
}) {
  return (
    <div className="bg-card border app-border rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={15} style={{ color }} />
        <h2 className="section-label">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function StatsContent() {
  const [period, setPeriod] = useState<Period>('7');

  const cardStats = useStore((s) => s.cardStats);
  const sets = useStore((s) => s.sets);
  const diaryEntries = useStore((s) => s.diaryEntries);
  const tasks = useStore((s) => s.tasks);
  const habits = useStore((s) => s.habits);
  const progress = useStore((s) => s.progress);
  const darkMode = useStore((s) => s.darkMode);

  const days = period === '7' ? 7 : 30;
  const dates = useMemo(() => getDates(days), [days]);

  const tooltipStyle = {
    backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
    border: `1px solid ${darkMode ? '#2a2a2a' : '#ebebeb'}`,
    borderRadius: '8px',
    fontSize: '12px',
    color: darkMode ? '#ffffff' : '#111111',
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  };

  const axisColor = darkMode ? 'rgba(255,255,255,0.25)' : '#9ca3af';
  const gridColor = darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6';

  // ── Lernen ───────────────────────────────────────────────────────────────
  const allCardStats = useMemo(
    () => Object.values(cardStats).flatMap((s) => Object.values(s)),
    [cardStats]
  );

  const studyData = useMemo(() => dates.map((date) => {
    const karten = allCardStats.filter(
      (s) => new Date(s.lastSeen).toISOString().slice(0, 10) === date
    ).length;
    return { date, label: fmtLabel(date, period), karten };
  }), [dates, allCardStats, period]);

  const totalCardsInPeriod = studyData.reduce((s, d) => s + d.karten, 0);
  const activeDaysInPeriod = studyData.filter((d) => d.karten > 0).length;

  const totalCorrect = allCardStats.reduce((s, c) => s + c.correct, 0);
  const totalIncorrect = allCardStats.reduce((s, c) => s + c.incorrect, 0);
  const totalAnswers = totalCorrect + totalIncorrect;

  const setScores = useMemo(() =>
    sets
      .map((s) => {
        const p = progress[s.id];
        const setStats = allCardStats.filter((cs) => cs.setId === s.id);
        const studied = setStats.reduce((sum, c) => sum + c.correct + c.incorrect, 0);
        return { name: s.name, quiz: p?.bestQuizScore ?? 0, test: p?.bestTestScore ?? 0, studied };
      })
      .filter((s) => s.quiz > 0 || s.test > 0 || s.studied > 0)
      .sort((a, b) => b.studied - a.studied)
      .slice(0, 5),
    [sets, progress, allCardStats]
  );

  // ── Tagebuch ─────────────────────────────────────────────────────────────
  const diaryInPeriod = useMemo(
    () => diaryEntries.filter((e) => dates.includes(e.date)),
    [diaryEntries, dates]
  );

  const moodData = useMemo(() => dates.map((date) => {
    const entry = diaryEntries.find((e) => e.date === date);
    return { date, label: fmtLabel(date, period), stimmung: entry?.mood };
  }), [dates, diaryEntries, period]);

  const avgMood = diaryInPeriod.length > 0
    ? diaryInPeriod.reduce((s, e) => s + e.mood, 0) / diaryInPeriod.length
    : null;

  // ── Tasks ─────────────────────────────────────────────────────────────────
  const taskData = useMemo(() => dates.map((date) => {
    const dayTasks = tasks.filter((t) => {
      if (t.recurring === 'täglich') return true;
      return !t.recurring && t.date === date;
    });
    const erledigt = dayTasks.filter((t) => {
      if (t.recurring) return t.completedDates.includes(date);
      return t.completed;
    }).length;
    return {
      label: fmtLabel(date, period),
      erledigt,
      offen: Math.max(0, dayTasks.length - erledigt),
      total: dayTasks.length,
    };
  }), [dates, tasks, period]);

  const totalTasksDone = taskData.reduce((s, d) => s + d.erledigt, 0);
  const totalTasksAll = taskData.reduce((s, d) => s + d.total, 0);
  const taskRate = totalTasksAll > 0 ? Math.round((totalTasksDone / totalTasksAll) * 100) : null;

  // ── Habits ────────────────────────────────────────────────────────────────
  const longestStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak)) : 0;

  const habitGridData = useMemo(() => habits.map((h) => ({
    name: h.name,
    streak: h.streak,
    daysChecked: dates.map((date) => h.checkIns.includes(date)),
    total: dates.filter((date) => h.checkIns.includes(date)).length,
  })), [habits, dates]);

  const bestHabit = habitGridData.reduce<typeof habitGridData[0] | null>(
    (best, h) => (h.total > (best?.total ?? -1) ? h : best),
    null
  );

  // ── Overview ─────────────────────────────────────────────────────────────
  const overviewStats = [
    { label: 'Gelernte Karten', value: totalCardsInPeriod, color: '#7F77DD', icon: BookOpen },
    { label: 'Aktive Lerntage', value: activeDaysInPeriod, color: '#7F77DD', icon: BookOpen },
    { label: 'Längster Streak', value: longestStreak, color: '#EF9F27', icon: Repeat2 },
    { label: 'Tasks erledigt', value: totalTasksDone, color: '#1D9E75', icon: ListChecks },
    { label: 'Tagebucheinträge', value: diaryInPeriod.length, color: '#378ADD', icon: CalendarDays },
  ];

  const barSize = period === '7' ? 20 : 9;

  return (
    <div className="max-w-2xl mx-auto pb-4">

        {/* Header + Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart2 size={20} style={{ color: '#7F77DD' }} />
            <h1 className="text-2xl font-bold app-text">Statistiken</h1>
          </div>
          <div className="flex bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded-lg p-0.5">
            {(['7', '30'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-white dark:bg-[#2a2a2a] app-text shadow-sm'
                    : ''
                }`}
                style={period !== p ? { color: '#888888' } : undefined}
              >
                {p} Tage
              </button>
            ))}
          </div>
        </div>

        {/* ÜBERBLICK */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {overviewStats.map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="bg-card border app-border rounded-2xl p-4"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={13} style={{ color }} />
                <p className="text-xs text-gray-400 dark:text-white/40 leading-tight">{label}</p>
              </div>
              <p className="text-2xl font-bold app-text">{value}</p>
            </div>
          ))}
        </div>

        {/* LERNEN */}
        <SectionCard title="Lernen" icon={BookOpen} color="#7F77DD">
          {totalCardsInPeriod === 0 ? (
            <EmptyState text={`Noch keine Lernaktivität in den letzten ${days} Tagen.`} />
          ) : (
            <>
              <p className="text-xs text-gray-400 dark:text-white/40 mb-3">Karten gelernt pro Tag</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={studyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: axisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: axisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: '#7F77DD', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(v) => [v, 'Karten']}
                  />
                  <Line
                    type="monotone"
                    dataKey="karten"
                    stroke="#7F77DD"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#7F77DD', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Richtig vs. Falsch */}
              {totalAnswers > 0 && (
                <div className="mt-5">
                  <p className="text-xs text-gray-400 dark:text-white/40 mb-3">Richtig vs. Falsch (gesamt)</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Richtig', value: totalCorrect, color: '#1D9E75' },
                      { label: 'Falsch', value: totalIncorrect, color: '#E24B4A' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-white/40 w-12 text-right shrink-0">{label}</span>
                        <div className="flex-1 bg-[#ebebeb] dark:bg-[#2a2a2a] rounded-full h-3.5 overflow-hidden">
                          <div
                            className="h-3.5 rounded-full transition-all duration-500"
                            style={{
                              width: `${(value / totalAnswers) * 100}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-white w-8 shrink-0">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Set-Scores */}
              {setScores.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs text-gray-400 dark:text-white/40 mb-3">Beste Scores</p>
                  <div className="space-y-2.5">
                    {setScores.map((s) => (
                      <div key={s.name} className="flex items-center gap-2 min-w-0">
                        <p className="text-xs text-gray-600 dark:text-white/60 truncate flex-1">{s.name}</p>
                        <div className="flex gap-1.5 shrink-0">
                          {s.quiz > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(127,119,221,0.12)', color: '#7F77DD' }}>
                              Quiz {s.quiz}%
                            </span>
                          )}
                          {s.test > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}>
                              Test {s.test}%
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* HABITS */}
        <SectionCard title="Gewohnheiten" icon={Repeat2} color="#EF9F27">
          {habits.length === 0 ? (
            <EmptyState text="Noch keine Gewohnheiten angelegt." />
          ) : (
            <>
              {/* Contribution Grid */}
              <div className="mb-5">
                {/* Date ticks */}
                <div className="flex items-center mb-1.5">
                  <div className="w-24 shrink-0" />
                  <div className="flex flex-1">
                    {dates.map((date, i) => {
                      const showLabel = i === 0 || i === Math.floor(days / 2) || i === days - 1;
                      return (
                        <div key={date} className="flex-1 flex justify-center">
                          {showLabel && (
                            <span className="text-[9px] text-gray-300 dark:text-white/20">
                              {new Date(date + 'T12:00:00').getDate()}.
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {habitGridData.map((habit) => (
                  <div key={habit.name} className="flex items-center mb-1.5">
                    <p className="text-xs text-gray-500 dark:text-white/50 w-24 shrink-0 truncate pr-2">{habit.name}</p>
                    <div className="flex flex-1 gap-0.5">
                      {habit.daysChecked.map((checked, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-[3px]"
                          style={{
                            height: '15px',
                            backgroundColor: checked
                              ? '#EF9F27'
                              : darkMode ? 'rgba(239,159,39,0.1)' : 'rgba(239,159,39,0.08)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-Habit stats */}
              <div className="space-y-2 mb-4">
                {habitGridData.map((h) => (
                  <div key={h.name} className="flex items-center gap-2">
                    <p className="text-xs text-gray-600 dark:text-white/60 truncate flex-1">{h.name}</p>
                    <span className="text-xs text-gray-400 dark:text-white/30 shrink-0">{h.total}/{days} Tage</span>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                      style={{ background: 'rgba(239,159,39,0.12)', color: '#EF9F27' }}
                    >
                      <Flame size={10} />
                      {h.streak}
                    </span>
                  </div>
                ))}
              </div>

              {bestHabit && (
                <div className="pt-3 border-t app-border">
                  <p className="text-xs text-gray-400 dark:text-white/40">
                    Konstanteste Gewohnheit:{' '}
                    <span className="font-semibold" style={{ color: '#EF9F27' }}>{bestHabit.name}</span>
                    {' '}({bestHabit.total}/{days} Tage)
                  </p>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* TAGEBUCH */}
        <SectionCard title="Tagebuch" icon={CalendarDays} color="#378ADD">
          {diaryInPeriod.length === 0 ? (
            <EmptyState text={`Noch keine Tagebucheinträge in den letzten ${days} Tagen.`} />
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#378ADD' }}>
                    {avgMood!.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Ø Stimmung</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {MOOD_LABELS[Math.round(avgMood!)]}
                </p>
              </div>

              <p className="text-xs text-gray-400 dark:text-white/40 mb-3">Stimmungsverlauf</p>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={moodData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: axisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11, fill: axisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ stroke: '#378ADD', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(v) => [MOOD_LABELS[v as number] ?? v, 'Stimmung']}
                  />
                  <Line
                    type="monotone"
                    dataKey="stimmung"
                    stroke="#378ADD"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#378ADD', strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </SectionCard>

        {/* TASKS */}
        <SectionCard title="Aufgaben" icon={ListChecks} color="#1D9E75">
          {totalTasksAll === 0 ? (
            <EmptyState text={`Noch keine Aufgaben in den letzten ${days} Tagen.`} />
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div>
                  <p className="text-3xl font-bold" style={{ color: '#1D9E75' }}>
                    {taskRate !== null ? `${taskRate}%` : '–'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">Erledigungsrate</p>
                </div>
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {totalTasksDone} von {totalTasksAll} erledigt
                </p>
              </div>

              <p className="text-xs text-gray-400 dark:text-white/40 mb-3">Erledigt vs. Offen pro Tag</p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={taskData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={barSize}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: axisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: axisColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="erledigt" name="Erledigt" fill="#1D9E75" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar
                    dataKey="offen"
                    name="Offen"
                    fill={darkMode ? '#2a2a2a' : '#ebebeb'}
                    stackId="a"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </SectionCard>

    </div>
  );
}
