"use client";

import { useState, useMemo } from 'react';
import { Hero } from '@/types/hero';
import { getHeroIconUrl, HERO_GRID_ICON_SIZE } from '@/constants';

interface HeroGridProps {
  heroes: Hero[];
  pickedHeroIds: number[];
  recommendedHeroIds: number[];
  selectionMode: 'ally' | 'enemy';
  onPickHero: (heroId: number) => void;
}

type AttributeFilter = 'all' | 'str' | 'agi' | 'int' | 'uni';

const ATTRIBUTE_FILTERS: { label: string; value: AttributeFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Str', value: 'str' },
  { label: 'Agi', value: 'agi' },
  { label: 'Int', value: 'int' },
  { label: 'Uni', value: 'uni' },
];

const ATTR_MAP: Record<string, AttributeFilter> = {
  str: 'str',
  agi: 'agi',
  int: 'int',
  all: 'uni',
};

export default function HeroGrid({ heroes, pickedHeroIds, recommendedHeroIds, selectionMode, onPickHero }: HeroGridProps) {
  const [filter, setFilter] = useState('');
  const [attrFilter, setAttrFilter] = useState<AttributeFilter>('all');

  const pickedSet = useMemo(() => new Set(pickedHeroIds), [pickedHeroIds]);
  const recommendedSet = useMemo(() => new Set(recommendedHeroIds), [recommendedHeroIds]);

  const filteredHeroes = useMemo(() => {
    let result = heroes;
    if (filter) {
      const lower = filter.toLowerCase();
      result = result.filter(h => h.localized_name.toLowerCase().includes(lower));
    }
    if (attrFilter !== 'all') {
      result = result.filter(h => ATTR_MAP[h.primary_attr] === attrFilter);
    }
    return result;
  }, [heroes, filter, attrFilter]);

  const borderColor = selectionMode === 'ally' ? 'border-emerald-500' : 'border-red-500';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Search heroes..."
          className="flex-1 rounded-lg bg-gray-800 px-4 py-2 text-gray-100 border border-gray-700 focus:border-cyan-500 focus:outline-none"
        />
        <div className="flex gap-1">
          {ATTRIBUTE_FILTERS.map(af => (
            <button
              key={af.value}
              type="button"
              onClick={() => setAttrFilter(af.value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                attrFilter === af.value
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {af.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`rounded-lg border ${borderColor} bg-gray-800/50 p-3`}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
          {filteredHeroes.map(hero => {
            const isPicked = pickedSet.has(hero.id);
            const isRecommended = recommendedSet.has(hero.id);
            return (
              <button
                key={hero.id}
                type="button"
                disabled={isPicked}
                onClick={() => onPickHero(hero.id)}
                className={`flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all ${
                  isPicked
                    ? 'opacity-30 cursor-not-allowed'
                    : isRecommended
                      ? 'ring-2 ring-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)] hover:bg-gray-700 cursor-pointer'
                      : 'hover:bg-gray-700 cursor-pointer'
                }`}
              >
                <img
                  src={getHeroIconUrl(hero.name)}
                  alt={hero.localized_name}
                  width={HERO_GRID_ICON_SIZE}
                  height={HERO_GRID_ICON_SIZE}
                  className="rounded"
                />
                <span className="w-full truncate text-center text-[10px] text-gray-300">
                  {hero.localized_name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
