import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  // Nur auf die Auth-Session warten (kommt aus localStorage — fast sofort)
  // isLoading (Daten) blockiert nicht mehr — Dashboard zeigt Skeleton/Leerstand
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#7F77DD] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
