import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useStore } from '../store';
import { generateId } from '../utils';
import type { Card, CardSet } from '../types';

const LANGUAGES = [
  'Deutsch', 'Englisch', 'Französisch', 'Spanisch', 'Italienisch',
  'Portugiesisch', 'Russisch', 'Chinesisch', 'Japanisch', 'Arabisch',
  'Latein', 'Andere',
];

function emptyCard(): Card {
  return { id: generateId(), front: '', back: '' };
}

export default function SetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sets = useStore((s) => s.sets);
  const addSet = useStore((s) => s.addSet);
  const updateSet = useStore((s) => s.updateSet);

  const isEditing = Boolean(id);
  const existing = sets.find((s) => s.id === id);

  const [name, setName] = useState('');
  const [lang1, setLang1] = useState('Deutsch');
  const [lang2, setLang2] = useState('Englisch');
  const [cards, setCards] = useState<Card[]>([emptyCard(), emptyCard()]);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');

  useEffect(() => {
    if (isEditing && existing) {
      setName(existing.name);
      setLang1(existing.language1);
      setLang2(existing.language2);
      setCards(existing.cards.length > 0 ? existing.cards : [emptyCard()]);
    }
  }, [isEditing, existing]);

  const updateCard = (index: number, field: 'front' | 'back', value: string) => {
    setIsDirty(true);
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addCard = () => { setIsDirty(true); setCards((prev) => [...prev, emptyCard()]); };

  const removeCard = (index: number) => {
    if (cards.length <= 1) return;
    setIsDirty(true);
    setCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkImport = () => {
    const newCards: Card[] = bulkText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .flatMap((line) => {
        const parts = line.split(/[,\t]/).map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          return [{ id: generateId(), front: parts[0], back: parts[1] }];
        }
        return [];
      });
    if (newCards.length > 0) {
      setCards((prev) => [...prev.filter((c) => c.front.trim() || c.back.trim()), ...newCards]);
      setIsDirty(true);
    }
    setBulkText('');
    setShowBulk(false);
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('Änderungen verwerfen und zurück?')) return;
    navigate('/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Bitte gib dem Set einen Namen.');
      return;
    }

    const validCards = cards.filter((c) => c.front.trim() && c.back.trim());
    if (validCards.length < 2) {
      setError('Du brauchst mindestens 2 ausgefüllte Karten.');
      return;
    }

    const set: CardSet = {
      id: existing?.id ?? generateId(),
      name: name.trim(),
      language1: lang1,
      language2: lang2,
      cards: validCards,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    if (isEditing) {
      updateSet(set);
    } else {
      addSet(set);
    }

    navigate('/');
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {isEditing ? 'Set bearbeiten' : 'Neues Set erstellen'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name des Sets
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setIsDirty(true); setName(e.target.value); }}
              placeholder="z.B. Englisch Kapitel 3"
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30 focus:border-transparent"
            />
          </div>

          {/* Sprachen */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Von (Vorderseite)
              </label>
              <select
                value={lang1}
                onChange={(e) => { setIsDirty(true); setLang1(e.target.value); }}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30"
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2 text-gray-400">→</div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nach (Rückseite)
              </label>
              <select
                value={lang2}
                onChange={(e) => { setIsDirty(true); setLang2(e.target.value); }}
                className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30"
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Karten */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Karten ({cards.filter((c) => c.front.trim() && c.back.trim()).length} ausgefüllt)
              </label>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_32px] gap-2 px-1">
                <span className="text-xs text-gray-400 font-medium">{lang1}</span>
                <span className="text-xs text-gray-400 font-medium">{lang2}</span>
                <span />
              </div>

              {cards.map((card, i) => (
                <div key={card.id} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                  <input
                    type="text"
                    value={card.front}
                    onChange={(e) => updateCard(i, 'front', e.target.value)}
                    placeholder={`Wort auf ${lang1}`}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={card.back}
                    onChange={(e) => updateCard(i, 'back', e.target.value)}
                    placeholder={`Wort auf ${lang2}`}
                    className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeCard(i)}
                    disabled={cards.length <= 1}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-400 disabled:opacity-0 disabled:cursor-default transition-colors text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-3">
              <button
                type="button"
                onClick={addCard}
                className="text-sm font-medium flex items-center gap-1" style={{ color: '#7F77DD' }}
              >
                <span>+</span> Karte hinzufügen
              </button>
              <button
                type="button"
                onClick={() => setShowBulk((v) => !v)}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium"
              >
                Mehrere auf einmal importieren
              </button>
            </div>

            {showBulk && (
              <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/60">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Eine Karte pro Zeile, Vorder- und Rückseite durch Komma oder Tab getrennt:
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 font-mono">Hund, Dog<br />Katze, Cat</p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Wort auf ${lang1}, Wort auf ${lang2}`}
                  rows={5}
                  className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7F77DD]/30 resize-none font-mono"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={!bulkText.trim()}
                    className="disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors hover:opacity-90"
                    style={bulkText.trim() ? { backgroundColor: '#7F77DD' } : undefined}
                  >
                    Importieren
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowBulk(false); setBulkText(''); }}
                    className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-3 py-1.5"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 text-white font-medium py-2.5 rounded-lg transition-colors text-sm hover:opacity-90"
              style={{ backgroundColor: '#7F77DD' }}
            >
              {isEditing ? 'Speichern' : 'Set erstellen'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
