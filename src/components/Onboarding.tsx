import { useState } from 'react';
import { LayoutDashboard, BookOpen, CalendarDays, Repeat2, ArrowRight, X, Lightbulb } from 'lucide-react';

type WelcomeScreen = { type: 'welcome' };
type FeatureScreen = {
  type: 'feature';
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
  tip: string;
};
type Screen = WelcomeScreen | FeatureScreen;

const SCREENS: Screen[] = [
  { type: 'welcome' },
  {
    type: 'feature',
    icon: LayoutDashboard,
    color: '#7F77DD',
    title: 'Dein Tagesüberblick',
    description:
      'Das Dashboard zeigt dir alles auf einen Blick: deinen aktuellen Streak, deine Kristalle, das Wetter sowie deine heutigen Aufgaben und Gewohnheiten. Hier beginnt dein Tag.',
    tip: 'Schau jeden Morgen rein — das Dashboard zeigt dir genau, was heute ansteht.',
  },
  {
    type: 'feature',
    icon: BookOpen,
    color: '#7F77DD',
    title: 'Vokabeln lernen',
    description:
      'Erstelle Sets mit Karteikarten und lerne sie mit verschiedenen Modi: Karten umdrehen, Multiple-Choice Quiz, Eingabe-Test oder den schnellen Blitz-Modus. Verdiene XP und steige im Level auf.',
    tip: 'Starte damit, dein erstes Vokabelset zu erstellen — es dauert nur eine Minute.',
  },
  {
    type: 'feature',
    icon: CalendarDays,
    color: '#1D9E75',
    title: 'Aufgaben & Tagebuch',
    description:
      'Erstelle Aufgaben für heute — einmalig, täglich oder wöchentlich wiederkehrend. Halte außerdem deine Gedanken mit einem täglichen Tagebucheintrag und Stimmungs-Auswahl fest.',
    tip: 'Füge deine erste Aufgabe für heute hinzu und verdiene Kristalle, wenn du sie abhakst.',
  },
  {
    type: 'feature',
    icon: Repeat2,
    color: '#EF9F27',
    title: 'Gewohnheiten aufbauen',
    description:
      'Füge Gewohnheiten hinzu, die du täglich tracken möchtest — zum Beispiel Lesen, Sport oder Vokabeln lernen. Jede Gewohnheit hat ihren eigenen Streak, der täglich wächst.',
    tip: 'Erstelle deine erste Gewohnheit und hake sie noch heute ab, um deinen Streak zu starten.',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  const isLast = step === SCREENS.length - 1;
  const screen = SCREENS[step];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2 min-h-[52px]">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
          >
            ← Zurück
          </button>
        ) : (
          <div />
        )}
        {!isLast && (
          <button
            onClick={onComplete}
            className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            Überspringen <X size={13} />
          </button>
        )}
      </div>

      {/* Inhalt */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-y-auto">
        {screen.type === 'welcome' ? (
          <div className="max-w-sm">
            <div
              className="inline-flex items-center justify-center rounded-3xl mx-auto mb-8 p-5"
              style={{ backgroundColor: '#0f1117' }}
            >
              <img src="/logo.svg" alt="Arete" className="h-16 w-auto" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Willkommen bei Arete
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
              Dein persönlicher Begleiter für Vokabeln, Aufgaben und Gewohnheiten — alles in einer App.
            </p>
            <p className="text-gray-400 dark:text-white/30 text-sm mt-4">
              Kurze Einführung in 4 Schritten
            </p>
          </div>
        ) : (
          <div className="max-w-sm w-full">
            {/* Icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: `${screen.color}18` }}
            >
              <screen.icon size={40} style={{ color: screen.color }} />
            </div>

            {/* Titel + Beschreibung */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {screen.title}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-6">
              {screen.description}
            </p>

            {/* Tipp-Box */}
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3.5 text-left border"
              style={{
                background: `${screen.color}0d`,
                borderColor: `${screen.color}30`,
              }}
            >
              <Lightbulb size={16} className="shrink-0 mt-0.5" style={{ color: screen.color }} />
              <p className="text-sm leading-relaxed" style={{ color: screen.color }}>
                <span className="font-semibold">Tipp: </span>
                {screen.tip}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-8 pb-8 pt-4 flex flex-col items-center gap-5">
        {/* Fortschrittspunkte */}
        <div className="flex items-center gap-2">
          {SCREENS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full transition-all duration-300 cursor-pointer"
              style={{
                width: i === step ? '24px' : '8px',
                height: '8px',
                backgroundColor: i === step ? '#7F77DD' : 'rgba(127,119,221,0.25)',
              }}
            />
          ))}
        </div>

        {/* Weiter/Los geht's */}
        <button
          onClick={isLast ? onComplete : () => setStep((s) => s + 1)}
          className="w-full max-w-xs text-white font-semibold py-3.5 rounded-xl text-base cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          style={{ backgroundColor: '#7F77DD' }}
        >
          {isLast ? (
            'Los geht\'s!'
          ) : (
            <>
              <span>Weiter</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
