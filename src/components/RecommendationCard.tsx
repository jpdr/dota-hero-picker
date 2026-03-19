"use client";

import { Recommendation } from '@/types/recommendation';
import { getHeroImageUrl } from '@/constants';

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
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

export default function RecommendationCard({ recommendation, rank }: RecommendationCardProps) {
  const { hero, compositeScore, playerWinRate, averageMatchupAdvantage, matchesPlayed, reasons } = recommendation;

  return (
    <div className="flex flex-col rounded-lg bg-gray-800 border border-gray-700 shadow-md overflow-hidden">
      <div className="relative">
        <img
          src={getHeroImageUrl(hero.name)}
          alt={hero.localized_name}
          className="w-full h-32 object-cover object-top"
        />
        <div className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-900/80 text-sm font-bold text-white">
          #{rank}
        </div>
        <div className={`absolute top-2 right-2 rounded-full px-3 py-1 text-xs font-bold text-white ${getScoreColor(compositeScore)}`}>
          {compositeScore.toFixed(3)}
        </div>
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
              <span className="mt-1 text-cyan-500">•</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
