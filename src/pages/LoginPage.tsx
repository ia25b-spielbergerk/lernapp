import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    if (err) {
      setError(mapError(err));
      setLoading(false);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-2xl mb-4 p-4" style={{ backgroundColor: '#0f1117' }}>
            <img src="/logo.svg" alt="Arete" className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Arete</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Melde dich an um weiterzulernen</p>
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
              E-Mail
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.de"
                required
                autoComplete="email"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-[#7F77DD] dark:focus:border-[#7F77DD] transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
              Passwort
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dein Passwort"
                required
                autoComplete="current-password"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-[#7F77DD] dark:focus:border-[#7F77DD] transition-colors text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end -mt-1">
            <Link to="/passwort-vergessen" className="text-xs hover:underline" style={{ color: '#7F77DD' }}>
              Passwort vergessen?
            </Link>
          </div>

          {error && (
            <p className="text-sm rounded-xl px-4 py-3 border" style={{ color: '#E24B4A', background: 'rgba(226,75,74,0.08)', borderColor: 'rgba(226,75,74,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="w-full flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl transition-opacity disabled:opacity-50 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#7F77DD' }}
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 dark:text-white/40 mt-6">
          Noch kein Konto?{' '}
          <Link to="/register" className="font-medium hover:underline" style={{ color: '#7F77DD' }}>
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}

function mapError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-Mail oder Passwort falsch.';
  if (msg.includes('Email not confirmed')) return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if (msg.includes('Too many requests')) return 'Zu viele Versuche. Bitte warte kurz.';
  return msg;
}
