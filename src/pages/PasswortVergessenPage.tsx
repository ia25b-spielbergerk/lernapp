import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, BookOpen, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function PasswortVergessenPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);

    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());

    setLoading(false);
    if (err && !err.message.includes('rate')) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 bg-[#f9f9f9] dark:bg-[#1a1a1a]">
            <BookOpen size={28} style={{ color: '#7F77DD' }} />
          </div>
          <h1 className="text-2xl font-bold app-text">Passwort zurücksetzen</h1>
          <p className="text-sm text-[#888888] dark:text-white/40 mt-1">
            Wir schicken dir einen Reset-Link per E-Mail
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <div className="rounded-xl px-4 py-4 text-sm border text-center" style={{ color: '#1D9E75', background: 'rgba(29,158,117,0.08)', borderColor: 'rgba(29,158,117,0.2)' }}>
              Falls ein Konto mit dieser E-Mail existiert, wurde eine Reset-E-Mail gesendet.
            </div>
            <p className="text-xs text-center text-[#888888] dark:text-white/30">
              Bitte auch den Spam-Ordner prüfen.
            </p>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full text-sm font-medium py-2.5 rounded-xl border app-border text-[#555555] dark:text-white/60 hover:border-[#7F77DD] transition-colors"
            >
              <ArrowLeft size={15} />
              Zurück zum Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#333333] dark:text-white/70 mb-1.5">
                E-Mail
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888] dark:text-white/30 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beispiel.de"
                  required
                  autoFocus
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 border app-border rounded-xl bg-card app-text placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-[#7F77DD] dark:focus:border-[#7F77DD] transition-colors text-sm"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm rounded-xl px-4 py-3 border" style={{ color: '#E24B4A', background: 'rgba(226,75,74,0.08)', borderColor: 'rgba(226,75,74,0.2)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl transition-opacity disabled:opacity-50 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: '#7F77DD' }}
            >
              {loading && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
            </button>

            <p className="text-center text-sm text-[#888888] dark:text-white/40">
              <Link to="/login" className="hover:underline inline-flex items-center gap-1" style={{ color: '#7F77DD' }}>
                <ArrowLeft size={13} />
                Zurück zum Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
