import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon, Sun, Shuffle, BarChart2, Trash2, Settings,
  Medal, RotateCcw, Info, ChevronRight, Download, Upload, AlertCircle, LogOut, User,
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
    localStorage.removeItem('lernapp_onboarded');
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

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Settings size={20} style={{ color: '#7F77DD' }} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Einstellungen</h1>
        </div>

        {/* Darstellung */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">
            Darstellung
          </h2>
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-pressed={darkMode}
            >
              <div className="flex items-center gap-3">
                {darkMode
                  ? <Moon size={18} style={{ color: '#7F77DD' }} />
                  : <Sun size={18} className="text-amber-400" />
                }
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                    {darkMode ? 'Dunkles Design aktiv' : 'Helles Design aktiv'}
                  </p>
                </div>
              </div>
              <div className="relative w-10 h-6 rounded-full shrink-0">
                <div
                  className="w-10 h-6 rounded-full transition-colors"
                  style={darkMode ? { backgroundColor: '#7F77DD' } : { backgroundColor: '#e5e7eb' }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      darkMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Lernen */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">
            Lernen
          </h2>
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={toggleMixed}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              aria-pressed={mixed}
            >
              <div className="flex items-center gap-3">
                <Shuffle
                  size={18}
                  style={mixed ? { color: '#7F77DD' } : undefined}
                  className={!mixed ? 'text-gray-400 dark:text-white/30' : ''}
                />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Beide Richtungen</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                    Karten in beiden Sprachen gemischt abfragen
                  </p>
                </div>
              </div>
              <div className="relative w-10 h-6 rounded-full shrink-0">
                <div
                  className="w-10 h-6 rounded-full transition-colors"
                  style={mixed ? { backgroundColor: '#7F77DD' } : { backgroundColor: '#e5e7eb' }}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      mixed ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Fortschritt */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">
            Fortschritt
          </h2>
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
            <button
              onClick={() => navigate('/badges')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Medal size={18} style={{ color: '#7F77DD' }} />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Badges</p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                    Errungenschaften und Fortschritt ansehen
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-white/20" />
            </button>
          </div>
        </section>

        {/* App */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">
            App
          </h2>
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/8">

            {/* Onboarding erneut */}
            <button
              onClick={handleResetOnboarding}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <RotateCcw size={18} style={{ color: '#7F77DD' }} className="shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Einführung erneut anzeigen
                </p>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                  Zeigt das Onboarding beim nächsten Start wieder an
                </p>
              </div>
            </button>

            {/* Statistiken zurücksetzen */}
            <button
              onClick={handleResetStats}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <BarChart2 size={18} style={{ color: '#EF9F27' }} className="shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Lernstatistiken zurücksetzen
                </p>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                  Kartenfehler, Fortschritt und Bestscores löschen
                </p>
              </div>
            </button>

            {/* App zurücksetzen */}
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
                    <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                      Alle Daten löschen und Onboarding neu starten
                    </p>
                  </div>
                </button>
              ) : (
                <div className="px-4 py-4" style={{ background: 'rgba(226,75,74,0.07)' }}>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#E24B4A' }}>
                    Wirklich alles löschen?
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mb-4 leading-relaxed">
                    Sets, Aufgaben, Gewohnheiten, Notizen, Tagebuch, XP und Kristalle werden unwiderruflich gelöscht. Das Onboarding wird erneut angezeigt.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="flex-1 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
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
          <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">
            Daten
          </h2>
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/8">

            {/* Export */}
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Download size={18} style={{ color: '#7F77DD' }} className="shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Daten exportieren</p>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                  Alle Daten als JSON-Datei herunterladen
                </p>
              </div>
            </button>

            {/* Import */}
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
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Upload size={18} style={{ color: '#7F77DD' }} className="shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Daten importieren</p>
                    <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5">
                      Backup-Datei einlesen und Daten wiederherstellen
                    </p>
                  </div>
                </button>
              ) : (
                <div className="px-4 py-4" style={{ background: 'rgba(127,119,221,0.07)' }}>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: '#7F77DD' }}>
                    Daten importieren?
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/40 mb-4 leading-relaxed">
                    Alle aktuellen Daten werden durch die Backup-Datei überschrieben. Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setConfirmImport(false); setImportData(null); }}
                      className="flex-1 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      className="flex-1 text-white text-sm font-medium py-2 rounded-lg transition-opacity hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: '#7F77DD' }}
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
          <h2 className="text-xs font-semibold text-gray-400 dark:text-white/30 uppercase tracking-wider mb-3">
            Konto
          </h2>
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/8">

            {/* Profil-Link */}
            <button
              onClick={() => navigate('/profil')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: profile?.avatar_color ?? '#7F77DD' }}
                >
                  {profile?.username ? getInitials(profile.username) || '?' : '?'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile?.username ?? user?.email ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Profil bearbeiten</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-white/20" />
            </button>

            {/* Abmelden */}
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
        <div className="flex items-center gap-2 text-gray-400 dark:text-white/20 text-xs px-1">
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
