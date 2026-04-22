import { useRef, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, CalendarDays, Repeat2, StickyNote,
  BarChart2, ShoppingBag, User, Moon, Sun, Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
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

const STORAGE_KEY = 'sidebar_collapsed';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const user = useStore((s) => s.user);
  const darkMode = useStore((s) => s.darkMode);
  const toggleDarkMode = useStore((s) => s.toggleDarkMode);
  const levelInfo = getLevelInfo(user.xp ?? 0);

  const [collapsed, setCollapsed] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

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

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 h-screen sticky top-0 border-r"
      style={{
        width: collapsed ? '60px' : '220px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRightColor: 'var(--border)',
        transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Logo + Toggle */}
      <div
        className="flex items-center border-b shrink-0 overflow-hidden"
        style={{
          borderBottomColor: 'var(--border)',
          height: '56px',
          padding: collapsed ? '0' : '0 12px 0 20px',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <p className="text-[15px] font-bold app-text" style={{ letterSpacing: '-0.3px' }}>Aretes</p>
            <p className="text-[10px]" style={{ color: 'var(--text-2)' }}>Dein Lernbegleiter</p>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg cursor-pointer transition-colors app-hover"
          style={{ color: 'var(--text-2)' }}
          title={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
        >
          <ChevronLeft
            size={16}
            style={{
              transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
              transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 overflow-y-auto" style={{ overflowX: 'hidden', padding: collapsed ? '12px 0' : '12px 8px' }}>
        {NAV_ITEMS.map(({ path, label, Icon }) => {
          const active = isActive(path);
          return (
            <div key={path} className="relative group">
              <Link
                to={path}
                className="flex items-center rounded-lg transition-colors"
                style={{
                  gap: collapsed ? '0' : '10px',
                  padding: collapsed ? '10px 0' : '9px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  ...(active
                    ? { backgroundColor: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600 }
                    : { color: 'var(--text-2)' }),
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = active ? 'var(--accent-bg)' : 'transparent'; }}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <span className="text-sm truncate">{label}</span>
                )}
              </Link>
              {/* Tooltip when collapsed */}
              {collapsed && (
                <div
                  className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap z-50 opacity-0 group-hover:opacity-100"
                  style={{
                    backgroundColor: 'var(--text-1)',
                    color: 'var(--bg-page)',
                    transition: 'opacity 150ms ease',
                  }}
                >
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div
        className="border-t relative shrink-0"
        style={{ borderTopColor: 'var(--border)', padding: collapsed ? '12px 0' : '12px 16px' }}
        ref={menuRef}
      >
        {/* Dropdown — fixed positioning so it always escapes overflow clipping */}
        {menuOpen && (() => {
          const rect = menuRef.current?.getBoundingClientRect();
          const pos = collapsed
            ? { left: (rect ? rect.right + 8 : 68), bottom: window.innerHeight - (rect ? rect.bottom : 60) }
            : { left: (rect ? rect.left : 0), bottom: window.innerHeight - (rect ? rect.top : 0) + 8 };
          return (
          <div
            className="rounded-xl border shadow-lg overflow-hidden"
            style={{
              position: 'fixed',
              zIndex: 9999,
              width: '208px',
              backgroundColor: 'var(--sidebar-bg)',
              borderColor: 'var(--border)',
              ...pos,
            }}
          >
            <button
              onClick={() => { setMenuOpen(false); navigate('/profil'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left cursor-pointer app-text app-hover"
            >
              <User size={15} style={{ color: 'var(--text-2)' }} />
              Profil bearbeiten
            </button>
            <button
              onClick={() => toggleDarkMode()}
              className="w-full flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm text-left cursor-pointer app-text app-hover"
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
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left cursor-pointer app-text app-hover"
            >
              <Settings size={15} style={{ color: 'var(--text-2)' }} />
              Einstellungen
            </button>
            <div className="border-t mx-2 my-1" style={{ borderColor: 'var(--border)' }} />
            <button
              onClick={async () => { setMenuOpen(false); await signOut(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left cursor-pointer"
              style={{ color: '#E24B4A' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(226,75,74,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <LogOut size={15} />
              Abmelden
            </button>
          </div>
          );
        })()}

        {/* Avatar row — full-width clickable button */}
        <div className="relative group">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-full flex items-center rounded-lg cursor-pointer transition-colors"
            style={{
              gap: collapsed ? '0' : '10px',
              padding: collapsed ? '6px 0' : '6px 8px',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold app-text truncate">{profile?.username ?? '…'}</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-2)' }}>Lvl {levelInfo.level}</p>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
              </>
            )}
          </button>
          {/* Tooltip when collapsed */}
          {collapsed && (
            <div
              className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap z-50 opacity-0 group-hover:opacity-100"
              style={{
                backgroundColor: 'var(--text-1)',
                color: 'var(--bg-page)',
                transition: 'opacity 150ms ease',
              }}
            >
              {profile?.username ?? 'Profil'} · Lvl {levelInfo.level}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
