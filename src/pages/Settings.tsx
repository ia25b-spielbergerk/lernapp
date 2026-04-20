import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon, Sun, Shuffle, BarChart2, Trash2, Settings,
  Medal, RotateCcw, Info, ChevronRight, Download, Upload, AlertCircle, LogOut,
} from 'lucide-react';
import Layout from '../components/Layout';
import { useStore } from '../store';
import { useAuth, getInitials } from '../lib/AuthContext';

const APP_VERSION = '1.0.0';

const ALL_STORAGE_KEYS = [
  'lernapp_sets', 'lernapp_progress', 'lernapp_user', 'lernapp_cardstats',
  'lernapp_daily', 'lernapp_darkmode', 'lernapp_diary', 'lernapp_tasks',
  'lernapp_habits', 'lernapp_notes', 'lernapp_onboarded', 'mixedMode',
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { signOut, user, profile } = useAuth();
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const [mixed, setMixed] = useState(() => localStorage.getItem('mixedMode') === 'true');
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const [importData, setImportData] = useState<Record<string, unknown> | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!importError) return;
    const t = setTimeout(() => setImportError(null), 3500);
    return () => clearTimeout(t);
  }, [importError]);

  const toggleMixed = () => {
    const next = !mixed;
    localStorage.setItem('mixedMode', String(next));
    setMixed(next);
  };

  const handleResetOnboarding = () => {
    if (user?.id) localStorage.removeItem(`lernapp_onboarded_${user.id}`);
    window.location.href = '/';
  };

  const handleResetStats = () => {
    if (!confirm('Alle Lernstatistiken zurücksetzen? Sets und Fortschritt bleiben erhalten.')) return;
    localStorage.removeItem('lernapp_cardstats');
    localStorage.removeItem('lernapp_progress');
    window.location.reload();
  };

  const handleResetAll = () => {
    ALL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    window.location.href = '/';
  };

  const handleExport = () => {
    const data: Record<string, unknown> = {};
    ALL_STORAGE_KEYS.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw !== null) {
        try { data[k] = JSON.parse(raw); }
        catch { data[k] = raw; }
      }
    });
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lernapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error();
        const hasKnownKey = ALL_STORAGE_KEYS.some((k) => k in parsed);
        if (!hasKnownKey) throw new Error();
        setImportData(parsed);
        setConfirmImport(true);
      } catch {
        setImportError('Ungültige Datei. Bitte eine Arete-Backup-Datei auswählen.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!importData) return;
    ALL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    Object.entries(importData).forEach(([k, v]) => {
      localStorage.setItem(k, JSON.stringify(v));
    });
    window.location.href = '/';
  };

  const TOGGLE_CLS = 'w-10 h-6 rounded-full transition-colors';
  const KNOB_CLS = 'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200';

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Settings size={20} style={{ color: '#7F77DD' }} />
          <h1 className="text-2xl font-semibold app-text">Einstellungen</h1>
        </div>

        {/* Darstellung */}
        <section className="mb-6">
          <h2 className="section-label mb-3">Darstellung</h2>
          <div className="bg-card border app-border rounded-xl overflow-hidden">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between px-4 py-3.5 app-hover transition-colors cursor-pointer"
              aria-pressed={darkMode}
            >
              <div className="flex items-center gap-3">
                {darkMode
                  ? <Moon size={18} style={{ color: '#7F77DD' }} />
                  : <Sun size={18} style={{ color: '#EF9F27' }} />
                }
                <div className="text-left">
                  <p className="text-sm font-medium app-text">Dark Mode</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                    {darkMode ? 'Dunkles Design aktiv' : 'Helles Design aktiv'}
                  </p>
                </div>
              </div>
              <div className="relative w-10 h-6 rounded-full shrink-0">
                <div
                  className={TOGGLE_CLS}
                  style={{ backgroundColor: darkMode ? '#7F77DD' : '#ebebeb' }}
                >
                  <span className={`${KNOB_CLS} ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Lernen */}
        <section className="mb-6">
          <h2 className="section-label mb-3">Lernen</h2>
          <div className="bg-card border app-border rounded-xl overflow-hidden">
            <button
              onClick={toggleMixed}
              className="w-full flex items-center justify-between px-4 py-3.5 app-hover transition-colors cursor-pointer"
              aria-pressed={mixed}
            >
              <div className="flex items-center gap-3">
                <Shuffle size={18} style={{ color: mixed ? '#7F77DD' : '#888888' }} />
                <div className="text-left">
                  <p className="text-sm font-medium app-text">Beide Richtungen</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                    Karten in beiden Sprachen gemischt abfragen
                  </p>
                </div>
              </div>
              <div className="relative w-10 h-6 rounded-full shrink-0">
                <div
                  className={TOGGLE_CLS}
                  style={{ backgroundColor: mixed ? '#7F77DD' : '#ebebeb' }}
                >
                  <span className={`${KNOB_CLS} ${mixed ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Fortschritt */}
        <section className="mb-6">
          <h2 className="section-label mb-3">Fortschritt</h2>
          <div className="bg-card border app-border rounded-xl overflow-hidden">
            <button
              onClick={() => navigate('/badges')}
              className="w-full flex items-center justify-between px-4 py-3.5 app-hover transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Medal size={18} style={{ color: '#7F77DD' }} />
                <div className="text-left">
                  <p className="text-sm font-medium app-text">Badges</p>
                  <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                    Errungenschaften und Fortschritt ansehen
                  </p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: '#bbbbbb' }} />
            </button>
          </div>
        </section>

        {/* App */}
        <section className="mb-6">
          <h2 className="section-label mb-3">App</h2>
          <div className="bg-card border app-border rounded-xl overflow-hidden divide-y app-divide">

            <button
              onClick={handleResetOnboarding}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left app-hover transition-colors cursor-pointer"
            >
              <RotateCcw size={18} style={{ color: '#7F77DD' }} className="shrink-0" />
              <div>
                <p className="text-sm font-medium app-text">Einführung erneut anzeigen</p>
                <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                  Zeigt das Onboarding beim nächsten Start wieder an
                </p>
              </div>
            </button>

            <button
              onClick={handleResetStats}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left app-hover transition-colors cursor-pointer"
            >
              <BarChart2 size={18} style={{ color: '#EF9F27' }} className="shrink-0" />
              <div>
                <p className="text-sm font-medium app-text">Lernstatistiken zurücksetzen</p>
                <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                  Kartenfehler, Fortschritt und Bestscores löschen
                </p>
              </div>
            </button>

            <div>
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer"
                  style={{ color: '#E24B4A' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(226,75,74,0.07)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <Trash2 size={18} className="shrink-0" />
                  <div>
                    <p className="text-sm font-medium">App zurücksetzen</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                      Alle Daten löschen und Onboarding neu starten
                    </p>
                  </div>
                </button>
              ) : (
                <div className="px-4 py-4" style={{ background: 'rgba(226,75,74,0.07)' }}>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#E24B4A' }}>
                    Wirklich alles löschen?
                  </p>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: '#888888' }}>
                    Sets, Aufgaben, Gewohnheiten, Notizen, Tagebuch, XP und Kristalle werden unwiderruflich gelöscht.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 border border-[#ebebeb] dark:border-[#2a2a2a] app-text text-sm font-medium py-2 rounded-lg app-hover transition-colors cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleResetAll}
                      className="flex-1 text-white text-sm font-medium py-2 rounded-lg transition-opacity hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: '#E24B4A' }}
                    >
                      Ja, alles löschen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Daten */}
        <section className="mb-6">
          <h2 className="section-label mb-3">Daten</h2>
          <div className="bg-card border app-border rounded-xl overflow-hidden divide-y app-divide">

            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left app-hover transition-colors cursor-pointer"
            >
              <Download size={18} style={{ color: '#7F77DD' }} className="shrink-0" />
              <div>
                <p className="text-sm font-medium app-text">Daten exportieren</p>
                <p className="text-xs mt-0.5" style={{ color: '#888888' }}>Alle Daten als JSON-Datei herunterladen</p>
              </div>
            </button>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              {!confirmImport ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left app-hover transition-colors cursor-pointer"
                >
                  <Upload size={18} style={{ color: '#7F77DD' }} className="shrink-0" />
                  <div>
                    <p className="text-sm font-medium app-text">Daten importieren</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888888' }}>Backup-Datei einlesen und Daten wiederherstellen</p>
                  </div>
                </button>
              ) : (
                <div className="px-4 py-4" style={{ background: 'rgba(127,119,221,0.07)' }}>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#7F77DD' }}>Daten importieren?</p>
                  <p className="text-xs mb-4 leading-relaxed" style={{ color: '#888888' }}>
                    Alle aktuellen Daten werden durch die Backup-Datei überschrieben.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setConfirmImport(false); setImportData(null); }}
                      className="flex-1 border border-[#ebebeb] dark:border-[#2a2a2a] app-text text-sm font-medium py-2 rounded-lg app-hover transition-colors cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      className="flex-1 text-white text-sm font-medium py-2 rounded-lg transition-opacity hover:opacity-90 cursor-pointer bg-[#111111] dark:bg-white dark:text-[#111111]"
                    >
                      Importieren
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Konto */}
        <section className="mb-6">
          <h2 className="section-label mb-3">Konto</h2>
          <div className="bg-card border app-border rounded-xl overflow-hidden divide-y app-divide">

            <button
              onClick={() => navigate('/profil')}
              className="w-full flex items-center justify-between px-4 py-3.5 app-hover transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: profile?.avatar_color ?? '#7F77DD' }}
                >
                  {profile?.username ? getInitials(profile.username) || '?' : '?'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium app-text">
                    {profile?.username ?? user?.email ?? '—'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#888888' }}>Profil bearbeiten</p>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: '#bbbbbb' }} />
            </button>

            <button
              onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer"
              style={{ color: '#E24B4A' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(226,75,74,0.07)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <LogOut size={18} className="shrink-0" />
              <p className="text-sm font-medium">Abmelden</p>
            </button>
          </div>
        </section>

        {/* Version */}
        <div className="flex items-center gap-2 text-xs px-1" style={{ color: '#bbbbbb' }}>
          <Info size={13} />
          <span>Arete v{APP_VERSION}</span>
        </div>
      </div>

      {/* Import-Fehler Toast */}
      {importError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium" style={{ backgroundColor: '#E24B4A' }}>
            <AlertCircle size={18} className="shrink-0" />
            <span>{importError}</span>
          </div>
        </div>
      )}
    </Layout>
  );
}
