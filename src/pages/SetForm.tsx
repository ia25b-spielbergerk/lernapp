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

const INPUT_CLS = 'border border-[#ebebeb] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a] app-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#111111] dark:focus:border-white transition-colors placeholder-[#bbbbbb]';

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
        <h1 className="text-2xl font-semibold app-text mb-6">
          {isEditing ? 'Set bearbeiten' : 'Neues Set erstellen'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium app-text mb-1.5">
              Name des Sets
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setIsDirty(true); setName(e.target.value); }}
              placeholder="z.B. Englisch Kapitel 3"
              className={`w-full ${INPUT_CLS}`}
            />
          </div>

          {/* Sprachen */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium app-text mb-1.5">
                Von (Vorderseite)
              </label>
              <select
                value={lang1}
                onChange={(e) => { setIsDirty(true); setLang1(e.target.value); }}
                className={`w-full ${INPUT_CLS}`}
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex items-end pb-2" style={{ color: '#888888' }}>→</div>
            <div className="flex-1">
              <label className="block text-sm font-medium app-text mb-1.5">
                Nach (Rückseite)
              </label>
              <select
                value={lang2}
                onChange={(e) => { setIsDirty(true); setLang2(e.target.value); }}
                className={`w-full ${INPUT_CLS}`}
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Karten */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium app-text">
                Karten ({cards.filter((c) => c.front.trim() && c.back.trim()).length} ausgefüllt)
              </label>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_32px] gap-2 px-1">
                <span className="text-xs font-medium" style={{ color: '#888888' }}>{lang1}</span>
                <span className="text-xs font-medium" style={{ color: '#888888' }}>{lang2}</span>
                <span />
              </div>

              {cards.map((card, i) => (
                <div key={card.id} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                  <input
                    type="text"
                    value={card.front}
                    onChange={(e) => updateCard(i, 'front', e.target.value)}
                    placeholder={`Wort auf ${lang1}`}
                    className={INPUT_CLS}
                  />
                  <input
                    type="text"
                    value={card.back}
                    onChange={(e) => updateCard(i, 'back', e.target.value)}
                    placeholder={`Wort auf ${lang2}`}
                    className={INPUT_CLS}
                  />
                  <button
                    type="button"
                    onClick={() => removeCard(i)}
                    disabled={cards.length <= 1}
                    className="transition-colors text-lg leading-none disabled:opacity-0 disabled:cursor-default cursor-pointer"
                    style={{ color: '#bbbbbb' }}
                    onMouseEnter={(e) => { if (cards.length > 1) e.currentTarget.style.color = '#E24B4A'; }}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#bbbbbb')}
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
                className="text-sm font-medium flex items-center gap-1 cursor-pointer hover:opacity-80"
                style={{ color: '#7F77DD' }}
              >
                <span>+</span> Karte hinzufügen
              </button>
              <button
                type="button"
                onClick={() => setShowBulk((v) => !v)}
                className="text-sm font-medium transition-colors cursor-pointer"
                style={{ color: '#888888' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
              >
                Mehrere auf einmal importieren
              </button>
            </div>

            {showBulk && (
              <div className="mt-3 border border-[#ebebeb] dark:border-[#2a2a2a] rounded-xl p-4 bg-[#f9f9f9] dark:bg-[#1a1a1a]">
                <p className="text-xs mb-2" style={{ color: '#888888' }}>
                  Eine Karte pro Zeile, Vorder- und Rückseite durch Komma oder Tab getrennt:
                </p>
                <p className="text-xs mb-3 font-mono" style={{ color: '#bbbbbb' }}>Hund, Dog<br />Katze, Cat</p>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`Wort auf ${lang1}, Wort auf ${lang2}`}
                  rows={5}
                  className={`w-full ${INPUT_CLS} resize-none font-mono`}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={!bulkText.trim()}
                    className="text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
                    style={{ backgroundColor: '#111111' }}
                  >
                    Importieren
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowBulk(false); setBulkText(''); }}
                    className="text-sm px-3 py-1.5 cursor-pointer transition-colors"
                    style={{ color: '#888888' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm rounded-lg px-3 py-2 border" style={{ color: '#E24B4A', background: 'rgba(226,75,74,0.08)', borderColor: 'rgba(226,75,74,0.2)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 border border-[#ebebeb] dark:border-[#2a2a2a] app-text font-medium py-2.5 rounded-lg transition-colors text-sm cursor-pointer app-hover"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex-1 font-medium py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity cursor-pointer bg-[#111111] dark:bg-white text-white dark:text-[#111111]"
            >
              {isEditing ? 'Speichern' : 'Set erstellen'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
