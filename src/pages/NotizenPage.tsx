import { useState, useMemo } from 'react';
import { Plus, Search, Pin, PinOff, Trash2, Tag, X, ChevronDown } from 'lucide-react';
import Layout from '../components/Layout';
import { useStore } from '../store';
import { generateId } from '../utils';
import type { Note } from '../types';

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Gerade eben';
  if (mins < 60) return `Vor ${mins} Min.`;
  if (hours < 24) return `Vor ${hours} Std.`;
  if (days === 1) return 'Gestern';
  return `Vor ${days} Tagen`;
}

// ── Notiz-Editor ─────────────────────────────────────────────────────────────

interface EditorProps {
  initial?: Note;
  onSave: (note: Note) => void;
  onCancel: () => void;
}

function NoteEditor({ initial, onSave, onCancel }: EditorProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return;
    const now = new Date().toISOString();
    const note: Note = {
      id: initial?.id ?? generateId(),
      title: title.trim(),
      content: content.trim(),
      tags,
      pinned: initial?.pinned ?? false,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(note);
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#ebebeb] dark:border-[#2a2a2a] rounded-xl p-4 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titel..."
        autoFocus
        className="w-full border-0 bg-transparent app-text text-base font-semibold placeholder-[#bbbbbb] focus:outline-none"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Notiz schreiben..."
        rows={5}
        className="w-full border-0 bg-transparent text-sm placeholder-[#bbbbbb] resize-none focus:outline-none"
        style={{ color: '#444444' }}
      />

      {/* Tags */}
      <div className="border-t border-[#ebebeb] dark:border-[#2a2a2a] pt-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(127,119,221,0.12)', color: '#7F77DD' }}>
              <Tag size={9} />
              {tag}
              <button onClick={() => removeTag(tag)} className="cursor-pointer ml-0.5 hover:opacity-70">
                <X size={9} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="Tag hinzufügen..."
            className="flex-1 text-xs border border-[#ebebeb] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#111111] app-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#111111] dark:focus:border-white placeholder-[#bbbbbb]"
          />
          <button
            onClick={addTag}
            disabled={!tagInput.trim()}
            className="text-xs disabled:opacity-40 cursor-pointer font-medium"
            style={{ color: '#7F77DD' }}
          >
            + Tag
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={!title.trim() && !content.trim()}
          className="text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer bg-[#111111] dark:bg-white dark:text-[#111111]"
        >
          {initial ? 'Speichern' : 'Notiz erstellen'}
        </button>
        <button
          onClick={onCancel}
          className="text-sm px-3 py-1.5 cursor-pointer transition-colors"
          style={{ color: '#888888' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}

// ── NotizenPage ───────────────────────────────────────────────────────────────

export default function NotizenPage() {
  const notes = useStore((s) => s.notes);
  const addNote = useStore((s) => s.addNote);
  const updateNote = useStore((s) => s.updateNote);
  const removeNote = useStore((s) => s.removeNote);

  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [notes]);

  const filtered = useMemo(() => {
    let result = [...notes];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.includes(q))
      );
    }
    if (activeTag) {
      result = result.filter((n) => n.tags.includes(activeTag));
    }
    return result.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, search, activeTag]);

  const togglePin = (note: Note) => {
    updateNote({ ...note, pinned: !note.pinned });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold app-text">Notizen</h1>
        <button
          onClick={() => { setCreating(true); setEditingId(null); }}
          className="flex items-center gap-1.5 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-opacity hover:opacity-90 cursor-pointer bg-[#111111] dark:bg-white dark:text-[#111111]"
        >
          <Plus size={15} /> Neu
        </button>
      </div>

      {/* Suche */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#888888' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen..."
          className="w-full border border-[#ebebeb] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] app-text rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#111111] dark:focus:border-white placeholder-[#bbbbbb]"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
            style={{ color: '#888888' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tag-Filter */}
      {allTags.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowTagFilter((v) => !v)}
            className="flex items-center gap-1 text-xs mb-2 cursor-pointer transition-colors"
            style={{ color: '#888888' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
          >
            <Tag size={11} />
            Tags filtern
            <ChevronDown size={11} className={`transition-transform ${showTagFilter ? 'rotate-180' : ''}`} />
          </button>
          {showTagFilter && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveTag(null)}
                className="text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer"
                style={activeTag === null
                  ? { borderColor: '#7F77DD', background: 'rgba(127,119,221,0.1)', color: '#7F77DD' }
                  : { borderColor: '#ebebeb', color: '#888888' }
                }
              >
                Alle
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className="text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer"
                  style={activeTag === tag
                    ? { borderColor: '#7F77DD', background: 'rgba(127,119,221,0.1)', color: '#7F77DD' }
                    : { borderColor: '#ebebeb', color: '#888888' }
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Neue Notiz */}
      {creating && (
        <div className="mb-4">
          <NoteEditor
            onSave={(note) => { addNote(note); setCreating(false); }}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {/* Notizen-Liste */}
      {filtered.length === 0 && !creating ? (
        <div className="text-center py-12 border-2 border-dashed border-[#ebebeb] dark:border-[#2a2a2a] rounded-2xl">
          <p className="text-sm app-text mb-1">
            {notes.length === 0 ? 'Noch keine Notizen' : 'Keine Treffer'}
          </p>
          <p className="text-xs" style={{ color: '#888888' }}>
            {notes.length === 0 ? 'Erstelle deine erste Notiz' : 'Andere Suche oder Filter versuchen'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((note) =>
            editingId === note.id ? (
              <div key={note.id} className="sm:col-span-2">
                <NoteEditor
                  initial={note}
                  onSave={(updated) => { updateNote(updated); setEditingId(null); }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <div
                key={note.id}
                onClick={() => setEditingId(note.id)}
                className="bg-card border app-border rounded-xl p-4 cursor-pointer hover:border-[#d0d0d0] dark:hover:border-[#3a3a3a] transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-sm font-semibold app-text flex-1 min-w-0 truncate">
                    {note.title || <span className="font-normal italic" style={{ color: '#888888' }}>Ohne Titel</span>}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePin(note); }}
                      className="p-1 rounded transition-colors cursor-pointer"
                      style={note.pinned ? { color: '#7F77DD' } : { color: '#bbbbbb' }}
                      title={note.pinned ? 'Unpin' : 'Pinnen'}
                    >
                      {note.pinned ? <Pin size={13} /> : <PinOff size={13} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`"${note.title || 'Notiz'}" löschen?`)) removeNote(note.id);
                      }}
                      className="p-1 rounded transition-colors cursor-pointer"
                      style={{ color: '#bbbbbb' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#E24B4A')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#bbbbbb')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {note.content && (
                  <p className="text-xs line-clamp-3 mb-2 leading-relaxed" style={{ color: '#888888' }}>
                    {note.content}
                  </p>
                )}
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {note.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(127,119,221,0.12)', color: '#7F77DD' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px]" style={{ color: '#bbbbbb' }}>{timeAgo(note.updatedAt)}</p>
              </div>
            )
          )}
        </div>
      )}
    </Layout>
  );
}
