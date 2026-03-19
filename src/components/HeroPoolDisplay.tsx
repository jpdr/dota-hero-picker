"use client";

import { useState } from 'react';
import { HeroPoolEntry } from '@/types/recommendation';
import { getHeroIconUrl } from '@/constants';

interface HeroPoolDisplayProps {
  heroPool: HeroPoolEntry[];
}

export default function HeroPoolDisplay({ heroPool }: HeroPoolDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (heroPool.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-gray-800 border border-gray-700">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-medium text-gray-100">
          Your Hero Pool ({heroPool.length} heroes)
        </span>
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="border-t border-gray-700 px-4 py-3">
          <div className="grid gap-2">
            {heroPool.map(entry => (
              <div
                key={entry.hero.id}
                className="flex items-center gap-3 rounded-md bg-gray-750 px-3 py-2"
              >
                <img
                  src={getHeroIconUrl(entry.hero.name)}
                  alt={entry.hero.localized_name}
                  className="h-6 w-6 object-contain"
                />
                <span className="flex-1 text-gray-200">{entry.hero.localized_name}</span>
                <span className="text-sm text-gray-400">{entry.games} games</span>
                <span className={`text-sm font-medium ${entry.winRate >= 0.55 ? 'text-emerald-400' : entry.winRate >= 0.5 ? 'text-cyan-400' : 'text-red-400'}`}>
                  {(entry.winRate * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
