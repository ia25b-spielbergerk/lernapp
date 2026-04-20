import { useState } from 'react';
import { BarChart2, ShoppingBag, Gem, BookOpen, CalendarCheck2, Repeat2, Trophy, NotebookPen } from 'lucide-react';
import Layout from '../components/Layout';
import { useStore } from '../store';
import StatsContent from './StatsContent';

type Tab = 'statistik' | 'shop';

export default function MehrPage() {
  const [tab, setTab] = useState<Tab>('statistik');
  const crystals = useStore((s) => s.user.crystals ?? 0);
  const dc = useStore((s) => s.dailyCrystals);

  return (
    <Layout>
      {/* Tab-Leiste */}
      <div className="flex bg-[#f5f5f5] dark:bg-[#1a1a1a] rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('statistik')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            tab === 'statistik'
              ? 'bg-white dark:bg-[#2a2a2a] app-text shadow-sm'
              : ''
          }`}
          style={tab !== 'statistik' ? { color: '#888888' } : undefined}
        >
          <BarChart2 size={15} />
          Statistik
        </button>
        <button
          onClick={() => setTab('shop')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            tab === 'shop'
              ? 'bg-white dark:bg-[#2a2a2a] app-text shadow-sm'
              : ''
          }`}
          style={tab !== 'shop' ? { color: '#888888' } : undefined}
        >
          <ShoppingBag size={15} />
          Shop
        </button>
      </div>

      {tab === 'statistik' && <StatsContent />}

      {tab === 'shop' && (
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} style={{ color: '#378ADD' }} />
              <h1 className="text-2xl font-semibold app-text">Shop</h1>
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2 border"
              style={{ background: 'rgba(55,138,221,0.09)', borderColor: 'rgba(55,138,221,0.22)' }}
            >
              <Gem size={18} style={{ color: '#378ADD' }} />
              <span className="text-lg font-bold" style={{ color: '#378ADD' }}>{crystals}</span>
            </div>
          </div>

          {/* Tägliches Kristall-Limit */}
          <div className="rounded-2xl border p-5 mb-6" style={{ background: 'rgba(55,138,221,0.06)', borderColor: 'rgba(55,138,221,0.18)' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold app-text">Heute verdient</p>
              <span className="text-sm font-bold" style={{ color: '#378ADD' }}>{dc.totalCapped} / 300</span>
            </div>
            <div className="w-full bg-[#ebebeb] dark:bg-[#2a2a2a] rounded-full h-2 mb-4">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((dc.totalCapped / 300) * 100, 100)}%`, backgroundColor: '#378ADD' }}
              />
            </div>
            <div className="space-y-2">
              {[
                { label: 'Tagebuch', Icon: NotebookPen, earned: dc.diaryGranted ? 10 : 0, cap: 10, done: dc.diaryGranted, color: '#378ADD' },
                { label: 'Tasks', Icon: CalendarCheck2, earned: dc.taskCrystals, cap: 50, done: dc.taskCrystals >= 50, color: '#1D9E75' },
                { label: 'Habits', Icon: Repeat2, earned: dc.rewardedHabitIds.length * 10, cap: null, done: false, color: '#EF9F27' },
                { label: 'Lerneinheiten', Icon: BookOpen, earned: dc.sessionCrystals, cap: 100, done: dc.sessionCrystals >= 100, color: '#7F77DD' },
                { label: 'Daily Challenge', Icon: Trophy, earned: dc.dailyChallengeGranted ? 20 : 0, cap: 20, done: dc.dailyChallengeGranted, color: '#1D9E75' },
              ].map(({ label, Icon, earned, cap, done, color }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Icon size={13} style={{ color }} />
                    <span style={{ color: '#888888' }}>{label}</span>
                  </div>
                  <span className={done ? 'font-semibold' : ''} style={done ? { color } : { color: '#888888' }}>
                    {earned}{cap !== null ? ` / ${cap}` : ''} <Gem size={10} className="inline mb-0.5" style={{ color }} />
                    {done && ' ✓'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: '#888888' }}>
              Level-Ups und Badges sind nicht limitiert.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-center py-12">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 bg-[#f9f9f9] dark:bg-[#1a1a1a]"
            >
              <ShoppingBag size={40} style={{ color: '#378ADD' }} />
            </div>
            <h2 className="text-xl font-semibold app-text mb-3">Bald verfügbar</h2>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#888888' }}>
              Hier kannst du bald mit Kristallen Belohnungen freischalten.
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
}
