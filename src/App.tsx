import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';

import Dashboard from './pages/Dashboard';
import LernenPage from './pages/LernenPage';
import PlanerPage from './pages/PlanerPage';
import GewohnheitenPage from './pages/GewohnheitenPage';
import NotizenPage from './pages/NotizenPage';
import SetForm from './pages/SetForm';
import StudyMenu from './pages/StudyMenu';
import Flashcards from './pages/Flashcards';
import Quiz from './pages/Quiz';
import TestMode from './pages/TestMode';
import BlitzMode from './pages/BlitzMode';
import DailyChallenge from './pages/DailyChallenge';
import Results from './pages/Results';
import BadgesPage from './pages/BadgesPage';
import ShopPage from './pages/ShopPage';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  const darkMode = useStore((s) => s.darkMode);
  const setsLength = useStore((s) => s.sets.length);
  const [showOnboarding, setShowOnboarding] = useState(
    () => localStorage.getItem('lernapp_onboarded') === null
  );

  const handleOnboardingComplete = () => {
    localStorage.setItem('lernapp_onboarded', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const { loadSets, loadUser } = useStore.getState();
    loadSets();
    loadUser();
  }, []);

  // Daily nach Sets-Load initialisieren (oder neu generieren wenn neuer Tag)
  useEffect(() => {
    useStore.getState().initDaily();
  }, [setsLength]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] text-gray-800 dark:text-gray-100 font-sans">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/lernen" element={<LernenPage />} />
        <Route path="/planer" element={<PlanerPage />} />
        <Route path="/gewohnheiten" element={<GewohnheitenPage />} />
        <Route path="/notizen" element={<NotizenPage />} />
        <Route path="/sets/new" element={<SetForm />} />
        <Route path="/sets/:id/edit" element={<SetForm />} />
        <Route path="/sets/:id/study" element={<StudyMenu />} />
        <Route path="/sets/:id/flashcards" element={<Flashcards />} />
        <Route path="/sets/:id/quiz" element={<Quiz />} />
        <Route path="/sets/:id/test" element={<TestMode />} />
        <Route path="/sets/:id/blitz" element={<BlitzMode />} />
        <Route path="/daily" element={<DailyChallenge />} />
        <Route path="/results" element={<Results />} />
        <Route path="/badges" element={<BadgesPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
    </ErrorBoundary>
  );
}
