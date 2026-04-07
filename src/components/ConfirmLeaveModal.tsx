import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmLeaveModal({ onConfirm, onCancel }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex justify-center mb-3">
          <AlertTriangle size={36} className="text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
          Session beenden?
        </h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          Dein Fortschritt in dieser Runde geht verloren.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Weiter lernen
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
          >
            Beenden
          </button>
        </div>
      </div>
    </div>
  );
}
