import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react';
import type { CardSet } from '../types';
import { useStore } from '../store';
import { generateId } from '../utils';

interface Props {
  set: CardSet;
}

export default function SetCard({ set }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const removeSet = useStore((s) => s.removeSet);
  const addSet = useStore((s) => s.addSet);
  const progress = useStore((s) => s.progress[set.id]);
  const weakCount = useStore((s) => {
    const stats = s.cardStats[set.id] ?? {};
    return Object.values(stats).filter((c) => c.incorrect > c.correct).length;
  });

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleDelete = () => {
    setMenuOpen(false);
    if (confirm(`Set "${set.name}" wirklich löschen?`)) {
      removeSet(set.id);
    }
  };

  const handleDuplicate = () => {
    setMenuOpen(false);
    if (confirm(`Set "${set.name}" wirklich kopieren?`)) {
      addSet({
        ...set,
        id: generateId(),
        name: `${set.name} (Kopie)`,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const bestScore = Math.max(progress?.bestQuizScore ?? 0, progress?.bestTestScore ?? 0);

  return (
    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5 hover:border-[#7F77DD]/50 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-base truncate">{set.name}</h3>
          <p className="text-sm text-gray-400 mt-0.5 truncate">
            {set.language1} → {set.language2}
          </p>
        </div>

        {/* Drei-Punkte-Menü */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1a1d26] border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
              <Link
                to={`/sets/${set.id}/edit`}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Pencil size={14} className="text-gray-400 dark:text-white/30" /> Bearbeiten
              </Link>
              <button
                onClick={handleDuplicate}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Copy size={14} className="text-gray-400 dark:text-white/30" /> Kopieren
              </button>
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors"
                style={{ color: '#E24B4A' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(226,75,74,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <Trash2 size={14} /> Löschen
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {set.cards.length} {set.cards.length === 1 ? 'Karte' : 'Karten'}
        </span>
        {bestScore > 0 && (
          <span className="text-sm font-medium" style={{ color: '#7F77DD' }}>
            Best: {bestScore}%
          </span>
        )}
        {weakCount > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(239,159,39,0.12)', color: '#EF9F27' }}>
            {weakCount} schwach
          </span>
        )}
      </div>

      <Link
        to={`/sets/${set.id}/study`}
        className="block w-full text-center text-white text-sm font-medium py-2 rounded-lg transition-opacity hover:opacity-80"
        style={{ backgroundColor: '#7F77DD' }}
      >
        Lernen
      </Link>
    </div>
  );
}
