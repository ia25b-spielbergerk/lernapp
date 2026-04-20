import { useState, useMemo } from 'react';
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Check,
  Frown, Meh, Smile, SmilePlus, Star, BookText, RotateCcw,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useStore } from '../store';
import { generateId } from '../utils';
import type { Task, TaskPriority, TaskRecurring, DiaryEntry } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${weekdays[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]}`;
}

function offsetDate(base: string, days: number): string {
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Mood ─────────────────────────────────────────────────────────────────────

const MOODS = [
  { value: 1 as const, label: 'Schlecht',  Icon: Frown,    hex: '#E24B4A' },
  { value: 2 as const, label: 'Okay',      Icon: Meh,      hex: '#EF9F27' },
  { value: 3 as const, label: 'Gut',       Icon: Smile,    hex: '#1D9E75' },
  { value: 4 as const, label: 'Sehr gut',  Icon: SmilePlus, hex: '#378ADD' },
  { value: 5 as const, label: 'Perfekt',   Icon: Star,     hex: '#7F77DD' },
];

const MOOD_CALENDAR_COLOR = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-400', 'bg-blue-400', 'bg-violet-400'];

// ── Priorität ────────────────────────────────────────────────────────────────

const PRIORITY_LABELS: Record<TaskPriority, string> = { hoch: 'Hoch', mittel: 'Mittel', niedrig: 'Niedrig' };
const PRIORITY_HEX: Record<TaskPriority, string> = {
  hoch: '#E24B4A',
  mittel: '#EF9F27',
  niedrig: '#1D9E75',
};

const NAV_BTN = 'p-1.5 rounded-lg transition-colors cursor-pointer app-hover';

// ── Tasks-Tab ────────────────────────────────────────────────────────────────

function TasksTab() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const removeTask = useStore((s) => s.removeTask);
  const completeTask = useStore((s) => s.completeTask);

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('mittel');
  const [recurring, setRecurring] = useState<TaskRecurring>(null);
  const [showForm, setShowForm] = useState(false);

  const dayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.recurring === 'täglich') return true;
      if (t.recurring === 'wöchentlich') {
        const sel = new Date(selectedDate + 'T00:00:00');
        const dayOfWeek = sel.getDay();
        const startOfWeek = new Date(sel);
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
        const startStr = startOfWeek.toISOString().slice(0, 10);
        const alreadyDoneThisWeek = t.completedDates.some((d) => d >= startStr && d <= selectedDate);
        return !alreadyDoneThisWeek;
      }
      return t.date === selectedDate;
    });
  }, [tasks, selectedDate]);

  const isTaskDone = (t: Task) => {
    if (t.recurring) return t.completedDates.includes(selectedDate);
    return t.completed;
  };

  const PRIORITY_ORDER = { hoch: 0, mittel: 1, niedrig: 2 };
  const sorted = [...dayTasks].sort((a, b) => {
    const aDone = isTaskDone(a) ? 1 : 0;
    const bDone = isTaskDone(b) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });

  const handleAdd = () => {
    if (!title.trim()) return;
    const task: Task = {
      id: generateId(),
      title: title.trim(),
      priority,
      date: selectedDate,
      completed: false,
      recurring,
      completedDates: [],
    };
    addTask(task);
    setTitle('');
    setShowForm(false);
  };

  const doneCount = dayTasks.filter(isTaskDone).length;
  const totalCount = dayTasks.length;

  return (
    <div>
      {/* Datums-Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setSelectedDate((d) => offsetDate(d, -1))} className={NAV_BTN}>
          <ChevronLeft size={18} style={{ color: '#888888' }} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold app-text">{formatDate(selectedDate)}</p>
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs flex items-center gap-0.5 mx-auto mt-0.5 cursor-pointer"
              style={{ color: '#7F77DD' }}
            >
              <RotateCcw size={11} /> Heute
            </button>
          )}
        </div>
        <button onClick={() => setSelectedDate((d) => offsetDate(d, 1))} className={NAV_BTN}>
          <ChevronRight size={18} style={{ color: '#888888' }} />
        </button>
      </div>

      {/* Fortschritt */}
      {totalCount > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: '#888888' }}>
            <span>{doneCount} von {totalCount} erledigt</span>
            {doneCount === totalCount && <span style={{ color: '#1D9E75' }}>Alle fertig!</span>}
          </div>
          <div className="w-full h-1.5 bg-[#ebebeb] dark:bg-[#2a2a2a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%`, backgroundColor: '#7F77DD' }}
            />
          </div>
        </div>
      )}

      {/* Task-Liste */}
      <div className="space-y-2 mb-4">
        {sorted.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: '#888888' }}>Keine Aufgaben für diesen Tag</p>
        )}
        {sorted.map((task) => {
          const done = isTaskDone(task);
          return (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-card border app-border rounded-xl px-4 py-3"
            >
              <button
                onClick={() => completeTask(task.id, selectedDate)}
                className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer"
                style={done
                  ? { borderColor: '#1D9E75', backgroundColor: '#1D9E75' }
                  : { borderColor: '#d0d0d0' }
                }
              >
                {done && <Check size={11} className="text-white" strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate transition-colors ${done ? '' : 'app-text'}`}
                   style={done ? { color: '#888888', textDecoration: 'line-through' } : undefined}>
                  {task.title}
                </p>
                {task.recurring && (
                  <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                    {task.recurring === 'täglich' ? 'Täglich wiederkehrend' : 'Wöchentlich wiederkehrend'}
                  </p>
                )}
              </div>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                style={{ color: PRIORITY_HEX[task.priority], background: `${PRIORITY_HEX[task.priority]}18` }}
              >
                {PRIORITY_LABELS[task.priority]}
              </span>
              {!task.recurring && (
                <button
                  onClick={() => {
                    if (window.confirm(`"${task.title}" löschen?`)) removeTask(task.id);
                  }}
                  className="transition-colors cursor-pointer shrink-0"
                  style={{ color: '#bbbbbb' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#E24B4A')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#bbbbbb')}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Neue Aufgabe */}
      {showForm ? (
        <div className="bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }}
            placeholder="Aufgabe eingeben..."
            autoFocus
            className="w-full border border-[#ebebeb] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] app-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#111111] dark:focus:border-white placeholder-[#bbbbbb]"
          />
          <div className="flex gap-2 flex-wrap">
            {(['hoch', 'mittel', 'niedrig'] as TaskPriority[]).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className="text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer"
                style={priority === p
                  ? { color: PRIORITY_HEX[p], background: `${PRIORITY_HEX[p]}18`, borderColor: 'transparent' }
                  : { borderColor: '#ebebeb', color: '#888888' }
                }
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
            <div className="w-px bg-[#ebebeb] dark:bg-[#2a2a2a] mx-1" />
            {([null, 'täglich', 'wöchentlich'] as TaskRecurring[]).map((r) => (
              <button
                key={String(r)}
                onClick={() => setRecurring(r)}
                className="text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer"
                style={recurring === r
                  ? { borderColor: '#7F77DD', background: 'rgba(127,119,221,0.1)', color: '#7F77DD' }
                  : { borderColor: '#ebebeb', color: '#888888' }
                }
              >
                {r === null ? 'Einmalig' : r === 'täglich' ? 'Täglich' : 'Wöchentlich'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!title.trim()}
              className="text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer bg-[#111111] dark:bg-white dark:text-[#111111]"
            >
              Hinzufügen
            </button>
            <button
              onClick={() => { setShowForm(false); setTitle(''); }}
              className="text-sm px-3 py-1.5 cursor-pointer transition-colors"
              style={{ color: '#888888' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-medium cursor-pointer"
          style={{ color: '#7F77DD' }}
        >
          <Plus size={16} /> Aufgabe hinzufügen
        </button>
      )}
    </div>
  );
}

// ── Tagebuch-Tab ─────────────────────────────────────────────────────────────

function DiaryTab() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const diaryEntries = useStore((s) => s.diaryEntries);
  const saveDiary = useStore((s) => s.saveDiary);
  const removeDiary = useStore((s) => s.removeDiary);

  const existing = useMemo(
    () => diaryEntries.find((e) => e.date === selectedDate) ?? null,
    [diaryEntries, selectedDate]
  );

  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(existing?.mood ?? 3);
  const [text, setText] = useState(existing?.text ?? '');
  const [saved, setSaved] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [prevDate, setPrevDate] = useState(selectedDate);
  if (selectedDate !== prevDate) {
    setPrevDate(selectedDate);
    setMood(existing?.mood ?? 3);
    setText(existing?.text ?? '');
    setSaved(false);
  }

  const handleSave = () => {
    if (!text.trim() && !mood) return;
    const now = new Date().toISOString();
    const entry: DiaryEntry = {
      id: existing?.id ?? generateId(),
      date: selectedDate,
      mood,
      text: text.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    saveDiary(entry);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const lookbackDate = offsetDate(today, -7);
  const lookbackEntry = diaryEntries.find((e) => e.date === lookbackDate);

  const calYear = new Date(selectedDate + 'T00:00:00').getFullYear();
  const calMonth = new Date(selectedDate + 'T00:00:00').getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calCells: (string | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(calYear, calMonth, i + 1);
      return d.toISOString().slice(0, 10);
    }),
  ];
  const MONTH_NAMES = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <div>
      {/* Datums-Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setSelectedDate((d) => offsetDate(d, -1))} className={NAV_BTN}>
          <ChevronLeft size={18} style={{ color: '#888888' }} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold app-text">{formatDate(selectedDate)}</p>
          {selectedDate !== today && (
            <button
              onClick={() => setSelectedDate(today)}
              className="text-xs flex items-center gap-0.5 mx-auto mt-0.5 cursor-pointer"
              style={{ color: '#7F77DD' }}
            >
              <RotateCcw size={11} /> Heute
            </button>
          )}
        </div>
        <button
          onClick={() => setSelectedDate((d) => offsetDate(d, 1))}
          disabled={selectedDate >= today}
          className={`${NAV_BTN} disabled:opacity-30 disabled:cursor-default`}
        >
          <ChevronRight size={18} style={{ color: '#888888' }} />
        </button>
      </div>

      {/* Mood-Auswahl */}
      <div className="flex gap-2 mb-4">
        {MOODS.map(({ value, label, Icon, hex }) => (
          <button
            key={value}
            onClick={() => setMood(value)}
            title={label}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all cursor-pointer"
            style={mood === value
              ? { borderColor: hex, background: `${hex}18`, color: hex }
              : { borderColor: '#ebebeb', color: '#bbbbbb' }
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        ))}
      </div>

      {/* Text */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Was beschäftigt dich heute? Gedanken, Erlebnisse, Gefühle..."
        rows={5}
        className="w-full border border-[#ebebeb] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] app-text rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#111111] dark:focus:border-white resize-none mb-3 placeholder-[#bbbbbb]"
      />

      <div className="flex gap-2 items-center mb-5">
        <button
          onClick={handleSave}
          className="flex-1 font-medium py-2.5 rounded-lg transition-colors text-sm cursor-pointer text-white hover:opacity-90"
          style={{ backgroundColor: saved ? '#1D9E75' : '#111111' }}
        >
          {saved ? 'Gespeichert!' : existing ? 'Aktualisieren' : 'Eintrag speichern'}
        </button>
        {existing && (
          <button
            onClick={() => {
              if (window.confirm('Eintrag löschen?')) {
                removeDiary(existing.id);
                setText('');
                setMood(3);
              }
            }}
            className="p-2.5 transition-colors cursor-pointer border border-[#ebebeb] dark:border-[#2a2a2a] rounded-lg"
            style={{ color: '#888888' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#E24B4A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* 7-Tage Rückblick */}
      {lookbackEntry && selectedDate === today && (
        <div className="bg-[#fffbf0] dark:bg-[#2a2510] border border-[#f0e8c0] dark:border-[#3a3010] rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
            <BookText size={13} /> Vor 7 Tagen geschrieben
          </p>
          <div className="flex items-center gap-2 mb-1.5">
            {(() => {
              const m = MOODS.find((mo) => mo.value === lookbackEntry.mood)!;
              const { Icon, hex, label } = m;
              return <><Icon size={14} style={{ color: hex }} /><span className="text-xs" style={{ color: '#888888' }}>{label}</span></>;
            })()}
          </div>
          {lookbackEntry.text && (
            <p className="text-xs italic leading-relaxed line-clamp-3" style={{ color: '#666666' }}>
              "{lookbackEntry.text}"
            </p>
          )}
        </div>
      )}

      {/* Kalender */}
      <button
        onClick={() => setShowCalendar((v) => !v)}
        className="flex items-center gap-1.5 text-xs transition-colors mb-3 cursor-pointer font-medium"
        style={{ color: '#888888' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
      >
        <ChevronRight size={13} className={`transition-transform ${showCalendar ? 'rotate-90' : ''}`} />
        Kalenderansicht
      </button>

      {showCalendar && (
        <div className="bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                const d = new Date(calYear, calMonth - 1, 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              className="p-1 cursor-pointer transition-colors"
              style={{ color: '#888888' }}
            >
              <ChevronLeft size={15} />
            </button>
            <p className="text-xs font-semibold app-text">
              {MONTH_NAMES[calMonth]} {calYear}
            </p>
            <button
              onClick={() => {
                const d = new Date(calYear, calMonth + 1, 1);
                if (d.toISOString().slice(0, 7) <= today.slice(0, 7)) {
                  setSelectedDate(d.toISOString().slice(0, 10));
                }
              }}
              className="p-1 cursor-pointer transition-colors"
              style={{ color: '#888888' }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map((d) => (
              <span key={d} className="text-[10px] font-medium" style={{ color: '#888888' }}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calCells.map((dateStr, i) => {
              if (!dateStr) return <div key={i} />;
              const entry = diaryEntries.find((e) => e.date === dateStr);
              const isSelected = dateStr === selectedDate;
              const isFuture = dateStr > today;
              return (
                <button
                  key={dateStr}
                  disabled={isFuture}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`aspect-square rounded-lg text-[11px] font-medium flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default ${
                    isSelected ? 'ring-2 ring-[#111111] dark:ring-white ring-offset-1' : ''
                  } ${
                    entry
                      ? MOOD_CALENDAR_COLOR[entry.mood] + ' text-white'
                      : isFuture
                        ? ''
                        : 'hover:bg-[#ebebeb] dark:hover:bg-[#2a2a2a]'
                  }`}
                  style={isFuture ? { color: '#bbbbbb' } : !entry ? { color: '#888888' } : undefined}
                >
                  {new Date(dateStr + 'T00:00:00').getDate()}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 flex-wrap mt-3 pt-2 border-t border-[#ebebeb] dark:border-[#2a2a2a]">
            {MOODS.map(({ value, label }) => (
              <div key={value} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${MOOD_CALENDAR_COLOR[value]}`} />
                <span className="text-[10px]" style={{ color: '#888888' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── PlanerPage ────────────────────────────────────────────────────────────────

type Tab = 'tasks' | 'diary';

export default function PlanerPage() {
  const [activeTab, setActiveTab] = useState<Tab>('tasks');

  return (
    <Layout>
      <h1 className="text-xl font-semibold app-text mb-4">Planer</h1>

      {/* Tabs */}
      <div className="flex bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded-xl p-1 mb-5">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'tasks'
              ? 'bg-white dark:bg-[#2a2a2a] app-text shadow-sm'
              : ''
          }`}
          style={activeTab !== 'tasks' ? { color: '#888888' } : undefined}
        >
          Aufgaben
        </button>
        <button
          onClick={() => setActiveTab('diary')}
          className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'diary'
              ? 'bg-white dark:bg-[#2a2a2a] app-text shadow-sm'
              : ''
          }`}
          style={activeTab !== 'diary' ? { color: '#888888' } : undefined}
        >
          Tagebuch
        </button>
      </div>

      {activeTab === 'tasks' ? <TasksTab /> : <DiaryTab />}
    </Layout>
  );
}
