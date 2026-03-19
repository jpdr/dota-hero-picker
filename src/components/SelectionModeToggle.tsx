"use client";

interface SelectionModeToggleProps {
  mode: 'ally' | 'enemy';
  onChange: (mode: 'ally' | 'enemy') => void;
  allyCount: number;
  enemyCount: number;
}

export default function SelectionModeToggle({ mode, onChange, allyCount, enemyCount }: SelectionModeToggleProps) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange('ally')}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          mode === 'ally'
            ? 'bg-emerald-600 text-white'
            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
        }`}
      >
        Pick Ally ({allyCount}/5)
      </button>
      <button
        type="button"
        onClick={() => onChange('enemy')}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          mode === 'enemy'
            ? 'bg-red-600 text-white'
            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
        }`}
      >
        Pick Enemy ({enemyCount}/5)
      </button>
    </div>
  );
}
