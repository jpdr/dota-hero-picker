"use client";

import { useState, useCallback } from 'react';
import { Hero } from '@/types/hero';
import { HeroPoolEntry, Recommendation, MatchupResult } from '@/types/recommendation';
import { fetchHeroMatchups } from '@/services/opendota-api';
import { computeMatchupAdvantage, computeCompositeScore, generateReasons } from '@/services/scoring';

interface UseRecommendationsResult {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  calculate: (heroPool: HeroPoolEntry[], enemyHeroIds: number[], heroes: Hero[]) => Promise<void>;
}

export function useRecommendations(): UseRecommendationsResult {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (
    heroPool: HeroPoolEntry[],
    enemyHeroIds: number[],
    heroes: Hero[],
  ) => {
    try {
      setLoading(true);
      setError(null);

      const heroMap = new Map(heroes.map(h => [h.id, h]));

      const matchupResults = await Promise.all(
        heroPool.map(entry => fetchHeroMatchups(entry.hero.id)),
      );

      const scored: Recommendation[] = heroPool.map((entry, index) => {
        const matchups = matchupResults[index];
        const { average, details } = computeMatchupAdvantage(matchups, enemyHeroIds);

        const matchupDetails: MatchupResult[] = details.map(d => ({
          enemyHero: heroMap.get(d.heroId) ?? { id: d.heroId, name: '', localized_name: 'Unknown', primary_attr: '', attack_type: '', roles: [], img: '', icon: '' },
          advantage: d.advantage,
          gamesPlayed: d.gamesPlayed,
        }));

        const compositeScore = computeCompositeScore(entry.winRate, average, entry.games);

        const reasons = generateReasons(
          entry.winRate,
          details.map(d => ({
            enemyName: heroMap.get(d.heroId)?.localized_name ?? 'Unknown',
            advantage: d.advantage,
          })),
          entry.games,
        );

        return {
          hero: entry.hero,
          compositeScore,
          playerWinRate: entry.winRate,
          averageMatchupAdvantage: average,
          matchesPlayed: entry.games,
          matchupDetails,
          reasons,
        };
      });

      scored.sort((a, b) => b.compositeScore - a.compositeScore);
      setRecommendations(scored.slice(0, 5));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendations, loading, error, calculate };
}
