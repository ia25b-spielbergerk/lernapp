import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { AuthProvider } from './lib/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Onboarding from './components/Onboarding';
import AuthGuard from './components/AuthGuard';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
import StatsPage from './pages/StatsPage';
import MehrPage from './pages/MehrPage';
import SettingsPage from './pages/Settings';

function AppRoutes() {
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

  useEffect(() => {
    useStore.getState().initDaily();
  }, [setsLength]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] text-gray-800 dark:text-gray-100 font-sans">
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      <Routes>
        {/* Öffentliche Routen */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Geschützte Routen */}
        <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
        <Route path="/lernen" element={<AuthGuard><LernenPage /></AuthGuard>} />
        <Route path="/planer" element={<AuthGuard><PlanerPage /></AuthGuard>} />
        <Route path="/gewohnheiten" element={<AuthGuard><GewohnheitenPage /></AuthGuard>} />
        <Route path="/notizen" element={<AuthGuard><NotizenPage /></AuthGuard>} />
        <Route path="/sets/new" element={<AuthGuard><SetForm /></AuthGuard>} />
        <Route path="/sets/:id/edit" element={<AuthGuard><SetForm /></AuthGuard>} />
        <Route path="/sets/:id/study" element={<AuthGuard><StudyMenu /></AuthGuard>} />
        <Route path="/sets/:id/flashcards" element={<AuthGuard><Flashcards /></AuthGuard>} />
        <Route path="/sets/:id/quiz" element={<AuthGuard><Quiz /></AuthGuard>} />
        <Route path="/sets/:id/test" element={<AuthGuard><TestMode /></AuthGuard>} />
        <Route path="/sets/:id/blitz" element={<AuthGuard><BlitzMode /></AuthGuard>} />
        <Route path="/daily" element={<AuthGuard><DailyChallenge /></AuthGuard>} />
        <Route path="/results" element={<AuthGuard><Results /></AuthGuard>} />
        <Route path="/badges" element={<AuthGuard><BadgesPage /></AuthGuard>} />
        <Route path="/shop" element={<AuthGuard><ShopPage /></AuthGuard>} />
        <Route path="/statistiken" element={<AuthGuard><StatsPage /></AuthGuard>} />
        <Route path="/mehr" element={<AuthGuard><MehrPage /></AuthGuard>} />
        <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}
