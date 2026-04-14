import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  // Nur auf die Auth-Session warten (kommt aus localStorage — fast sofort)
  // isLoading (Daten) blockiert nicht mehr — Dashboard zeigt Skeleton/Leerstand
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center gap-4">
        <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <img src="/logo.svg" alt="Arete" className="h-14 w-auto" />
        </div>
        <p className="text-white text-xl font-bold tracking-wide">Arete</p>
        <div className="w-7 h-7 rounded-full border-2 border-[#7F77DD] border-t-transparent animate-spin mt-1" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
