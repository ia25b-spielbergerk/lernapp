import { useState } from 'react';
import { Plus, Trash2, Flame, Check } from 'lucide-react';
import Layout from '../components/Layout';
import { useStore } from '../store';
import { generateId } from '../utils';
import type { Habit } from '../types';

function offsetDate(base: string, days: number): string {
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getLast7Days(today: string): string[] {
  return Array.from({ length: 7 }, (_, i) => offsetDate(today, i - 6));
}

const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export default function GewohnheitenPage() {
  const today = new Date().toISOString().slice(0, 10);
  const habits = useStore((s) => s.habits);
  const addHabit = useStore((s) => s.addHabit);
  const removeHabit = useStore((s) => s.removeHabit);
  const checkInHabit = useStore((s) => s.checkInHabit);

  const [newName, setNewName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const last7 = getLast7Days(today);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const habit: Habit = {
      id: generateId(),
      name: newName.trim(),
      createdAt: new Date().toISOString(),
      streak: 0,
      lastCheckedDate: null,
      checkIns: [],
    };
    addHabit(habit);
    setNewName('');
    setShowForm(false);
  };

  const allDoneToday = habits.length > 0 && habits.every((h) => h.checkIns.includes(today));

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold app-text">Gewohnheiten</h1>
        {allDoneToday && (
          <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#1D9E75' }}>
            <Check size={13} /> Alle erledigt!
          </span>
        )}
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[#ebebeb] dark:border-[#2a2a2a] rounded-2xl mb-4">
          <Flame size={40} className="mx-auto mb-3" style={{ color: '#bbbbbb' }} />
          <p className="text-sm app-text mb-1">Noch keine Gewohnheiten</p>
          <p className="text-xs" style={{ color: '#888888' }}>Erstelle deine erste Gewohnheit und baue Streaks auf</p>
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {/* Wochengrid Header */}
          <div className="flex items-center">
            <div className="flex-1 min-w-0" />
            <div className="flex gap-1 shrink-0">
              {last7.map((d) => (
                <div key={d} className="w-8 text-center">
                  <span className="text-[10px] font-medium" style={{ color: '#888888' }}>
                    {WEEKDAY_SHORT[new Date(d + 'T00:00:00').getDay()]}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-7 shrink-0" />
          </div>

          {habits.map((habit) => {
            const doneToday = habit.checkIns.includes(today);
            return (
              <div
                key={habit.id}
                className="bg-card border app-border rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 mb-2">
                  {/* Check-Button */}
                  <button
                    onClick={() => checkInHabit(habit.id, today)}
                    className="w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer"
                    style={doneToday
                      ? { borderColor: '#1D9E75', backgroundColor: '#1D9E75' }
                      : { borderColor: '#d0d0d0' }
                    }
                  >
                    {doneToday && <Check size={12} className="text-white" strokeWidth={3} />}
                  </button>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate transition-colors ${doneToday ? '' : 'app-text'}`}
                       style={doneToday ? { color: '#888888' } : undefined}>
                      {habit.name}
                    </p>
                  </div>

                  {/* Streak */}
                  {habit.streak > 0 && (
                    <div className="flex items-center gap-1 shrink-0" style={{ color: '#EF9F27' }}>
                      <Flame size={13} />
                      <span className="text-xs font-semibold">{habit.streak}</span>
                    </div>
                  )}

                  {/* Wochengrid */}
                  <div className="flex gap-1 shrink-0">
                    {last7.map((d) => {
                      const checked = habit.checkIns.includes(d);
                      const isToday = d === today;
                      return (
                        <button
                          key={d}
                          onClick={() => checkInHabit(habit.id, d)}
                          disabled={d > today}
                          title={d}
                          className={`w-8 h-6 rounded transition-colors cursor-pointer disabled:cursor-default ${
                            checked
                              ? isToday
                                ? 'bg-[#1D9E75]'
                                : 'bg-[#1D9E75]/60'
                              : isToday
                                ? 'bg-[#ebebeb] dark:bg-[#2a2a2a] border-2 border-dashed border-[#d0d0d0] dark:border-[#3a3a3a]'
                                : d > today
                                  ? 'bg-[#f9f9f9] dark:bg-[#1a1a1a] opacity-40'
                                  : 'bg-[#ebebeb] dark:bg-[#2a2a2a] hover:bg-[#e0e0e0] dark:hover:bg-[#333]'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Löschen */}
                  <button
                    onClick={() => {
                      if (window.confirm(`"${habit.name}" und alle Check-ins löschen?`)) removeHabit(habit.id);
                    }}
                    className="transition-colors cursor-pointer shrink-0"
                    style={{ color: '#bbbbbb' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#E24B4A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#bbbbbb')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Streak-Nachricht */}
                {habit.streak >= 3 && (
                  <p className="text-xs ml-9" style={{ color: '#EF9F27' }}>
                    {habit.streak} Tage in Folge — weiter so!
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Neue Gewohnheit */}
      {showForm ? (
        <div className="bg-[#f9f9f9] dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] rounded-xl p-4 space-y-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }}
            placeholder="Name der Gewohnheit..."
            autoFocus
            className="w-full border border-[#ebebeb] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] app-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#111111] dark:focus:border-white placeholder-[#bbbbbb]"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: '#EF9F27' }}
            >
              Erstellen
            </button>
            <button
              onClick={() => { setShowForm(false); setNewName(''); }}
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
          className="flex items-center gap-2 text-sm font-medium cursor-pointer hover:opacity-80"
          style={{ color: '#EF9F27' }}
        >
          <Plus size={16} /> Gewohnheit hinzufügen
        </button>
      )}
    </Layout>
  );
}
