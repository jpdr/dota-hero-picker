"use client";

import { Recommendation } from '@/types/recommendation';
import { getHeroImageUrl } from '@/constants';
import { MetaTier } from '@/types/meta';
import { TimingTag } from '@/services/timing';
import ItemSuggestionList from './ItemSuggestionList';

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
  itemsLoading?: boolean;
  onClick?: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 0.6) {
    return 'bg-emerald-600';
  }
  if (score >= 0.5) {
    return 'bg-cyan-600';
  }
  return 'bg-gray-600';
}

function getTierColor(tier: MetaTier): string {
  switch (tier) {
    case 'S': return 'bg-amber-500 text-gray-900';
    case 'A': return 'bg-emerald-500 text-gray-900';
    case 'B': return 'bg-cyan-600 text-white';
    case 'C': return 'bg-gray-500 text-white';
    case 'D': return 'bg-gray-700 text-gray-300';
  }
}

function getTimingColor(tag: TimingTag): string {
  switch (tag) {
    case 'Early Dominator': return 'bg-red-600/80 text-white';
    case 'Mid-game Tempo': return 'bg-yellow-600/80 text-white';
    case 'Late-game Carry': return 'bg-blue-600/80 text-white';
    case 'Balanced': return 'bg-gray-600/80 text-white';
  }
}

export default function RecommendationCard({ recommendation, rank, itemsLoading, onClick }: RecommendationCardProps) {
  const { hero, compositeScore, playerWinRate, averageMatchupAdvantage, matchesPlayed, reasons, itemSuggestions, timingTag, metaTier } = recommendation;

  return (
    <div
      onClick={onClick}
      className={`group/card flex flex-col rounded-lg bg-gray-800 border border-gray-700 shadow-md overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover:scale-[1.02] hover:border-emerald-500/50' : ''
      }`}
    >
      <div className="relative">
        <img
          src={getHeroImageUrl(hero.name)}
          alt={hero.localized_name}
          className="w-full h-32 object-cover object-top"
        />
        <div className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900/80 text-sm font-bold text-white">
          #{rank}
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {metaTier && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getTierColor(metaTier)}`}>
              {metaTier}-tier
            </span>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${getScoreColor(compositeScore)}`}>
            {compositeScore.toFixed(3)}
          </span>
        </div>
        {timingTag && timingTag !== 'Balanced' && (
          <div className="absolute bottom-2 left-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getTimingColor(timingTag)}`}>
              {timingTag}
            </span>
          </div>
        )}
        {onClick && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/card:opacity-100">
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white">Click to pick</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <h3 className="text-lg font-semibold text-gray-100">{hero.localized_name}</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className={`text-lg font-bold ${playerWinRate >= 0.55 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {(playerWinRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${averageMatchupAdvantage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {averageMatchupAdvantage >= 0 ? '+' : ''}{(averageMatchupAdvantage * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Matchup</div>
          </div>
          <div>
            <div className="text-lg font-bold text-cyan-400">{matchesPlayed}</div>
            <div className="text-xs text-gray-400">Games</div>
          </div>
        </div>
        <ul className="flex flex-col gap-1 text-sm text-gray-300">
          {reasons.map((reason, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 text-cyan-500">&#8226;</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <ItemSuggestionList items={itemSuggestions ?? []} loading={itemsLoading} />
      </div>
    </div>
  );
}
