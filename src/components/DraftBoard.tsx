"use client";

import { Hero } from '@/types/hero';
import { getHeroImageUrl } from '@/constants';

interface DraftBoardProps {
  allies: (Hero | null)[];
  enemies: (Hero | null)[];
  onRemoveAlly: (index: number) => void;
  onRemoveEnemy: (index: number) => void;
}

function DraftSlot({
  hero,
  accent,
  onRemove,
}: {
  hero: Hero | null;
  accent: 'ally' | 'enemy';
  onRemove: () => void;
}) {
  const borderColor = accent === 'ally' ? 'border-emerald-500' : 'border-red-500';
  const hoverBorder = accent === 'ally' ? 'hover:border-emerald-400' : 'hover:border-red-400';

  if (!hero) {
    return (
      <div className={`flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/50 text-gray-500`}>
        <span className="text-2xl">+</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onRemove}
      className={`group relative flex h-20 w-20 flex-col items-center justify-center overflow-hidden rounded-lg border-2 ${borderColor} ${hoverBorder} bg-gray-800 transition-colors`}
    >
      <img
        src={getHeroImageUrl(hero.name)}
        alt={hero.localized_name}
        className="h-14 w-full object-cover object-top"
      />
      <span className="w-full truncate px-1 text-center text-[10px] text-gray-200">
        {hero.localized_name}
      </span>
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
        <span className="text-xl text-red-400">&times;</span>
      </div>
    </button>
  );
}

export default function DraftBoard({ allies, enemies, onRemoveAlly, onRemoveEnemy }: DraftBoardProps) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-emerald-400">YOUR TEAM</span>
          <div className="flex flex-wrap gap-2">
            {allies.map((hero, i) => (
              <DraftSlot key={i} hero={hero} accent="ally" onRemove={() => onRemoveAlly(i)} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <span className="text-sm font-semibold text-red-400">ENEMY TEAM</span>
          <div className="flex flex-wrap gap-2">
            {enemies.map((hero, i) => (
              <DraftSlot key={i} hero={hero} accent="enemy" onRemove={() => onRemoveEnemy(i)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
