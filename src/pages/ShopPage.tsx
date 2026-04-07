import { ShoppingBag, Gem } from 'lucide-react';
import Layout from '../components/Layout';
import { useStore } from '../store';

export default function ShopPage() {
  const crystals = useStore((s) => s.user.crystals ?? 0);

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} style={{ color: '#378ADD' }} />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop</h1>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-4 py-2 border" style={{ background: 'rgba(55,138,221,0.09)', borderColor: 'rgba(55,138,221,0.22)' }}>
            <Gem size={18} style={{ color: '#378ADD' }} />
            <span className="text-lg font-bold" style={{ color: '#378ADD' }}>{crystals}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center py-24">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(55,138,221,0.09)' }}>
            <ShoppingBag size={40} style={{ color: '#378ADD' }} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Bald verfügbar</h2>
          <p className="text-gray-400 dark:text-white/40 text-sm leading-relaxed max-w-xs">
            Hier kannst du bald mit Kristallen Belohnungen freischalten.
          </p>
        </div>
      </div>
    </Layout>
  );
}
