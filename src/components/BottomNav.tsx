import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CalendarDays, Repeat2, StickyNote, Grid2x2 } from 'lucide-react';
import { useStore } from '../store';

const TABS = [
  { path: '/',             label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/lernen',       label: 'Lernen',    Icon: BookOpen        },
  { path: '/planer',       label: 'Planer',    Icon: CalendarDays    },
  { path: '/gewohnheiten', label: 'Habits',    Icon: Repeat2         },
  { path: '/notizen',      label: 'Notizen',   Icon: StickyNote      },
  { path: '/mehr',         label: 'Mehr',      Icon: Grid2x2         },
] as const;

export default function BottomNav() {
  const location = useLocation();
  const darkMode = useStore((s) => s.darkMode);

  const activeColor = 'var(--accent)';
  const inactiveColor = darkMode ? 'rgba(255,255,255,0.35)' : '#bbbbbb';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 border-t"
      style={{ backgroundColor: 'var(--bg-page)', borderTopColor: 'var(--border)' }}
    >
      <div className="max-w-4xl mx-auto flex items-stretch">
        {TABS.map(({ path, label, Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors cursor-pointer border-t-2"
              style={active
                ? { color: activeColor, borderTopColor: activeColor }
                : { color: inactiveColor, borderTopColor: 'transparent' }
              }
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
