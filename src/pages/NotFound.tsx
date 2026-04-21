import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import Layout from '../components/Layout';

export default function NotFound() {
  return (
    <Layout>
      <div className="text-center py-24">
        <Search size={56} className="mx-auto mb-4 text-[#cccccc] dark:text-[#444444]" />
        <h1 className="text-2xl font-bold text-[#111111] dark:text-white mb-2">Seite nicht gefunden</h1>
        <p className="text-[#888888] text-sm mb-6">Diese Seite existiert nicht.</p>
        <Link
          to="/"
          className="inline-block text-white font-medium px-6 py-2.5 rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: '#7F77DD' }}
        >
          Zurück zur Startseite
        </Link>
      </div>
    </Layout>
  );
}
