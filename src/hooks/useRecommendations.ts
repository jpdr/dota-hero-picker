"use client";

import { useState, useCallback } from 'react';
import { Hero, HeroMatchup } from '@/types/hero';
import { HeroPoolEntry, Recommendation } from '@/types/recommendation';
import { HeroLaneData, LaneType } from '@/types/lane';
import { HeroMetaScore } from '@/types/meta';
import { fetchHeroMatchups, fetchHeroDurations, fetchHeroAllyWinRates } from '@/services/opendota-api';
import { scoreHeroPool, filterPoolByLane } from '@/services/scoring';
import { classifyTiming, TimingTag } from '@/services/timing';
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
    allyHeroIds?: number[],
    metaScores?: Map<number, HeroMetaScore>,
  ) => Promise<void>;
}

async function fetchWithConcurrencyLimit<T>(
  items: { id: number }[],
  fetchFn: (id: number) => Promise<T>,
  maxConcurrent: number,
): Promise<(T | null)[]> {
  const results: (T | null)[] = new Array(items.length).fill(null);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = await fetchFn(items[index].id);
      } catch {
        // leave as null
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(maxConcurrent, items.length) },
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
    allyHeroIds?: number[],
    metaScores?: Map<number, HeroMetaScore>,
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

      const poolItems = filteredPool.map(e => ({ id: e.hero.id }));

      const matchupResults = await fetchWithConcurrencyLimit<HeroMatchup[]>(
        poolItems,
        (id) => fetchHeroMatchups(id),
        MAX_CONCURRENT_FETCHES,
      );

      const durationResults = await fetchWithConcurrencyLimit(
        poolItems,
        (id) => fetchHeroDurations(id),
        MAX_CONCURRENT_FETCHES,
      );

      const timingTags = new Map<number, TimingTag>();
      for (let i = 0; i < filteredPool.length; i++) {
        const durations = durationResults[i];
        if (durations && durations.length > 0) {
          timingTags.set(filteredPool[i].hero.id, classifyTiming(durations));
        }
      }

      let allyResults: ({ hero_id: number; games: number; wins: number }[] | null)[] | undefined;
      const effectiveAllyIds = allyHeroIds ?? [];
      if (effectiveAllyIds.length > 0) {
        allyResults = await fetchWithConcurrencyLimit(
          poolItems,
          (id) => fetchHeroAllyWinRates(id, effectiveAllyIds),
          MAX_CONCURRENT_FETCHES,
        );
      }

      const scored = scoreHeroPool({
        heroPool: filteredPool,
        matchupResults,
        enemyHeroIds,
        heroes,
        laneDataMap,
        laneType,
        allyResults,
        allyHeroIds: effectiveAllyIds,
        metaScores,
        timingTags,
      });
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
