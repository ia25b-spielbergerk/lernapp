import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, UserPlus, Check, User } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = password === confirm;
  const passwordLongEnough = password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password || !passwordsMatch || !passwordLongEnough) return;
    setLoading(true);
    setError(null);
    const err = await signUp(email.trim(), password, username.trim());
    if (err) {
      setError(mapError(err));
      setLoading(false);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ backgroundColor: 'rgba(29,158,117,0.12)' }}>
            <Check size={28} style={{ color: '#1D9E75' }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Registrierung erfolgreich!</h2>
          <p className="text-sm text-gray-400 dark:text-white/40 mb-6">
            Wir haben dir eine Bestätigungs-E-Mail an <strong className="text-gray-700 dark:text-white/70">{email}</strong> geschickt. Bitte bestätige deine E-Mail-Adresse und melde dich dann an.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="text-white font-medium px-6 py-2.5 rounded-xl transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: '#7F77DD' }}
          >
            Zum Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-2xl mb-4 p-4" style={{ backgroundColor: '#0f1117' }}>
            <img src="/logo.svg" alt="Arete" className="h-12 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Konto erstellen</h1>
          <p className="text-sm text-gray-400 dark:text-white/40 mt-1">Starte deine Lernreise</p>
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
              Benutzername
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Dein Benutzername"
                required
                autoComplete="username"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-[#7F77DD] dark:focus:border-[#7F77DD] transition-colors text-sm"
              />
            </div>
          </div>

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
              Passwort <span className="text-gray-400 dark:text-white/30 font-normal">(mind. 6 Zeichen)</span>
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort wählen"
                required
                autoComplete="new-password"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-[#7F77DD] dark:focus:border-[#7F77DD] transition-colors text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
              Passwort bestätigen
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 pointer-events-none" />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Passwort wiederholen"
                required
                autoComplete="new-password"
                className={`w-full pl-9 pr-4 py-2.5 border rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none transition-colors text-sm ${
                  confirm && !passwordsMatch
                    ? 'border-[#E24B4A] focus:border-[#E24B4A]'
                    : 'border-gray-200 dark:border-white/10 focus:border-[#7F77DD] dark:focus:border-[#7F77DD]'
                }`}
              />
            </div>
            {confirm && !passwordsMatch && (
              <p className="text-xs mt-1" style={{ color: '#E24B4A' }}>Passwörter stimmen nicht überein.</p>
            )}
          </div>

          {error && (
            <p className="text-sm rounded-xl px-4 py-3 border" style={{ color: '#E24B4A', background: 'rgba(226,75,74,0.08)', borderColor: 'rgba(226,75,74,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !email.trim() || !password || !passwordsMatch || !passwordLongEnough}
            className="w-full flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl transition-opacity disabled:opacity-50 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: '#7F77DD' }}
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <UserPlus size={16} />
            )}
            {loading ? 'Registrieren...' : 'Konto erstellen'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 dark:text-white/40 mt-6">
          Bereits ein Konto?{' '}
          <Link to="/login" className="font-medium hover:underline" style={{ color: '#7F77DD' }}>
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}

function mapError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('User already registered')) return 'Diese E-Mail-Adresse ist bereits registriert.';
  if (msg.includes('Password should be at least')) return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  if (msg.includes('Invalid email')) return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (msg.includes('Too many requests')) return 'Zu viele Versuche. Bitte warte kurz.';
  return msg;
}
