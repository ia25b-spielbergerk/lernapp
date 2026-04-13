import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Save, AlertCircle, Check } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth, getInitials } from '../lib/AuthContext';

const COLORS = [
  { name: 'Violett', hex: '#7F77DD' },
  { name: 'Orange',  hex: '#EF9F27' },
  { name: 'Blau',    hex: '#378ADD' },
  { name: 'Grün',    hex: '#1D9E75' },
  { name: 'Rot',     hex: '#E24B4A' },
  { name: 'Pink',    hex: '#D4537E' },
];

export default function ProfilPage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState('#7F77DD');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '');
      setBio(profile.bio ?? '');
      setAvatarColor(profile.avatar_color ?? '#7F77DD');
    }
  }, [profile]);

  const initials = getInitials(username) || '?';

  const handleSave = async () => {
    if (!username.trim()) return;
    setSaving(true);
    setError(null);
    const err = await updateProfile({
      username: username.trim(),
      bio: bio.trim() || null,
      avatar_color: avatarColor,
    });
    setSaving(false);
    if (err) {
      setError('Fehler beim Speichern. Bitte versuche es erneut.');
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 transition-colors cursor-pointer"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <User size={20} style={{ color: '#7F77DD' }} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mein Profil</h1>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm mb-2"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <p className="text-xs text-gray-400 dark:text-white/30">Avatar wird automatisch aus deinen Initialen erstellt</p>
        </div>

        {/* Felder */}
        <div className="space-y-5">

          {/* Benutzername */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
              Benutzername <span className="text-[#E24B4A]">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Dein Benutzername"
              maxLength={50}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-[#7F77DD] dark:focus:border-[#7F77DD] transition-colors text-sm"
            />
          </div>

          {/* E-Mail (nur anzeigen) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
              E-Mail-Adresse
            </label>
            <div className="w-full px-4 py-2.5 border border-gray-100 dark:border-white/8 rounded-xl bg-gray-50 dark:bg-white/3 text-gray-400 dark:text-white/30 text-sm select-none">
              {user?.email ?? '—'}
            </div>
            <p className="text-xs text-gray-400 dark:text-white/25 mt-1">Die E-Mail-Adresse kann nicht geändert werden.</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">
              Kurze Bio <span className="text-gray-400 dark:text-white/30 font-normal">(optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= 150) setBio(e.target.value);
              }}
              placeholder="Erzähl kurz etwas über dich…"
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/25 focus:outline-none focus:border-[#7F77DD] dark:focus:border-[#7F77DD] transition-colors text-sm resize-none"
            />
            <p className="text-xs text-gray-400 dark:text-white/25 mt-1 text-right">{bio.length}/150</p>
          </div>

          {/* Farbe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-3">
              Avatar-Farbe
            </label>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setAvatarColor(c.hex)}
                  title={c.name}
                  className="relative w-10 h-10 rounded-full cursor-pointer transition-transform hover:scale-110"
                  style={{ backgroundColor: c.hex }}
                >
                  {avatarColor === c.hex && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check size={18} className="text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Fehler */}
          {error && (
            <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl border" style={{ color: '#E24B4A', background: 'rgba(226,75,74,0.08)', borderColor: 'rgba(226,75,74,0.2)' }}>
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Speichern */}
          <button
            onClick={handleSave}
            disabled={saving || !username.trim()}
            className="w-full flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl transition-opacity disabled:opacity-50 cursor-pointer hover:opacity-90"
            style={{ backgroundColor: saved ? '#1D9E75' : '#7F77DD' }}
          >
            {saving ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : saved ? (
              <Check size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving ? 'Speichern…' : saved ? 'Gespeichert!' : 'Änderungen speichern'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
