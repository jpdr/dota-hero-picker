"use client";

import { useState, useCallback } from 'react';
import { Hero, HeroMatchup } from '@/types/hero';
import { HeroPoolEntry, Recommendation } from '@/types/recommendation';
import { fetchHeroMatchups } from '@/services/opendota-api';
import { scoreHeroPool } from '@/services/scoring';
import { MAX_CONCURRENT_FETCHES } from '@/constants';

interface UseRecommendationsResult {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  calculate: (heroPool: HeroPoolEntry[], enemyHeroIds: number[], heroes: Hero[]) => Promise<void>;
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
  ) => {
    try {
      setLoading(true);
      setError(null);

      const matchupResults = await fetchMatchupsWithConcurrencyLimit(heroPool, MAX_CONCURRENT_FETCHES);

      const scored = scoreHeroPool(heroPool, matchupResults, enemyHeroIds, heroes);
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
