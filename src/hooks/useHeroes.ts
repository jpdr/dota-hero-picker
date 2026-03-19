"use client";

import { useState, useEffect } from 'react';
import { Hero } from '@/types/hero';
import { fetchHeroes } from '@/services/opendota-api';

interface UseHeroesResult {
  heroes: Hero[];
  loading: boolean;
  error: string | null;
}

export function useHeroes(): UseHeroesResult {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchHeroes();
        if (!cancelled) {
          setHeroes(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch heroes');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { heroes, loading, error };
}
