import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarDays, Repeat2, StickyNote, BarChart2, ShoppingBag, User, Moon, Sun, Settings, LogOut } from 'lucide-react';
import { useAuth, getInitials } from '../lib/AuthContext';
import { useStore } from '../store';
import { getLevelInfo } from '../xp';

const NAV_ITEMS = [
  { path: '/',             label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/lernen',       label: 'Lernen',    Icon: BookOpen        },
  { path: '/planer',       label: 'Planer',    Icon: CalendarDays    },
  { path: '/gewohnheiten', label: 'Habits',    Icon: Repeat2         },
  { path: '/notizen',      label: 'Notizen',   Icon: StickyNote      },
  { path: '/statistiken',  label: 'Statistik', Icon: BarChart2       },
  { path: '/shop',         label: 'Shop',      Icon: ShoppingBag     },
] as const;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const user = useStore((s) => s.user);
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const levelInfo = getLevelInfo(user.xp ?? 0);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initials = getInitials(profile?.username ?? '') || '?';
  const avatarColor = profile?.avatar_color ?? 'var(--accent)';

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r"
      style={{ width: '220px', backgroundColor: 'var(--sidebar-bg)', borderRightColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <p className="text-[18px] font-bold app-text" style={{ letterSpacing: '-0.3px' }}>Aretes</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-2)' }}>Dein Lernbegleiter</p>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={active
                ? { backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600 }
                : { color: 'var(--text-2)' }
              }
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div
        className="px-4 py-4 border-t relative"
        style={{ borderTopColor: 'var(--border)' }}
        ref={menuRef}
      >
        {/* Dropdown */}
        {menuOpen && (
          <div
            className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border shadow-lg overflow-hidden z-50"
            style={{ backgroundColor: 'var(--sidebar-bg)', borderColor: 'var(--border)' }}
          >
            <button
              onClick={() => { setMenuOpen(false); navigate('/profil'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer app-text app-hover"
            >
              <User size={15} style={{ color: 'var(--text-2)' }} />
              Profil bearbeiten
            </button>

            <button
              onClick={() => { toggleDarkMode(); }}
              className="w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer app-text app-hover"
            >
              <span className="flex items-center gap-2.5">
                {darkMode
                  ? <Sun size={15} style={{ color: 'var(--text-2)' }} />
                  : <Moon size={15} style={{ color: 'var(--text-2)' }} />
                }
                Dark Mode
              </span>
              <span
                className="text-[11px] font-semibold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-2)' }}
              >
                {darkMode ? 'An' : 'Aus'}
              </span>
            </button>

            <button
              onClick={() => { setMenuOpen(false); navigate('/einstellungen'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer app-text app-hover"
            >
              <Settings size={15} style={{ color: 'var(--text-2)' }} />
              Einstellungen
            </button>

            <div className="border-t mx-2 my-1" style={{ borderColor: 'var(--border)' }} />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors cursor-pointer"
              style={{ color: '#E24B4A' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(226,75,74,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <LogOut size={15} />
              Abmelden
            </button>
          </div>
        )}

        {/* Avatar row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            style={{ backgroundColor: avatarColor }}
            title="Menü öffnen"
          >
            {initials}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold app-text truncate">{profile?.username ?? '…'}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>Lvl {levelInfo.level}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
