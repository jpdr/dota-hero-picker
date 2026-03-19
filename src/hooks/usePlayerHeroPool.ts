"use client";

import { useState, useCallback } from 'react';
import { Hero } from '@/types/hero';
import { HeroPoolEntry } from '@/types/recommendation';
import { fetchPlayerHeroes } from '@/services/opendota-api';
import { buildHeroPool } from '@/services/scoring';

interface UsePlayerHeroPoolResult {
  heroPool: HeroPoolEntry[];
  loading: boolean;
  error: string | null;
  load: (accountId: string, heroes: Hero[]) => Promise<boolean>;
}

export function usePlayerHeroPool(): UsePlayerHeroPoolResult {
  const [heroPool, setHeroPool] = useState<HeroPoolEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (accountId: string, heroes: Hero[]): Promise<boolean> => {
    if (heroes.length === 0) {
      setError('Hero data is not yet loaded. Please wait and try again.');
      return false;
    }

    try {
      setLoading(true);
      setError(null);
      const playerHeroes = await fetchPlayerHeroes(accountId);
      const pool = buildHeroPool(playerHeroes, heroes);
      setHeroPool(pool);
      return pool.length > 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load player data');
      setHeroPool([]);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { heroPool, loading, error, load };
}
