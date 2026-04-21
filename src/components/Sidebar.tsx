import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarDays, Repeat2, StickyNote, BarChart2, ShoppingBag, Settings } from 'lucide-react';
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
  const { profile } = useAuth();
  const user = useStore((s) => s.user);
  const levelInfo = getLevelInfo(user.xp ?? 0);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const initials = getInitials(profile?.username ?? '') || '?';
  const avatarColor = profile?.avatar_color ?? 'var(--accent)';

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r"
      style={{
        width: '220px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRightColor: 'var(--border)',
      }}
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
        className="px-4 py-4 border-t flex items-center gap-3"
        style={{ borderTopColor: 'var(--border)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold app-text truncate">{profile?.username ?? '…'}</p>
          <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>Lvl {levelInfo.level}</p>
        </div>
        <button
          onClick={() => navigate('/profil')}
          className="shrink-0 transition-opacity hover:opacity-70 cursor-pointer"
          style={{ color: 'var(--text-2)' }}
          title="Einstellungen"
        >
          <Settings size={15} />
        </button>
      </div>
    </aside>
  );
}
