"use client";

import { useState, useCallback } from 'react';
import { Hero, HeroMatchup } from '@/types/hero';
import { HeroPoolEntry, Recommendation } from '@/types/recommendation';
import { HeroLaneData, LaneType } from '@/types/lane';
import { fetchHeroMatchups } from '@/services/opendota-api';
import { scoreHeroPool, filterPoolByLane } from '@/services/scoring';
import { MAX_CONCURRENT_FETCHES } from '@/constants';

interface UseRecommendationsResult {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  calculate: (
    heroPool: HeroPoolEntry[],
    enemyHeroIds: number[],
    heroes: Hero[],
    laneDataMap?: Map<number, HeroLaneData>,
    laneType?: LaneType,
  ) => Promise<void>;
}

async function fetchMatchupsWithConcurrencyLimit(
  heroPool: HeroPoolEntry[],
  maxConcurrent: number,
): Promise<(HeroMatchup[] | null)[]> {
  const results: (HeroMatchup[] | null)[] = new Array(heroPool.length).fill(null);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < heroPool.length) {
      const index = nextIndex++;
      const result = await fetchHeroMatchups(heroPool[index].hero.id)
        .then(data => ({ status: 'fulfilled' as const, value: data }))
        .catch(() => ({ status: 'rejected' as const }));

      if (result.status === 'fulfilled') {
        results[index] = result.value;
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, heroPool.length) },
    () => worker(),
  );
  await Promise.all(workers);

  return results;
}

export function useRecommendations(): UseRecommendationsResult {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (
    heroPool: HeroPoolEntry[],
    enemyHeroIds: number[],
    heroes: Hero[],
    laneDataMap?: Map<number, HeroLaneData>,
    laneType?: LaneType,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const filteredPool = laneDataMap && laneType
        ? filterPoolByLane(heroPool, laneDataMap, laneType)
        : heroPool;

      if (filteredPool.length === 0) {
        setError('No heroes in your pool match the selected lane. Try a different lane or "Any".');
        setRecommendations([]);
        return;
      }

      const matchupResults = await fetchMatchupsWithConcurrencyLimit(filteredPool, MAX_CONCURRENT_FETCHES);

      const scored = scoreHeroPool(filteredPool, matchupResults, enemyHeroIds, heroes, laneDataMap, laneType);
      setRecommendations(scored);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendations, loading, error, calculate };
}
