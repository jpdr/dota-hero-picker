"use client";

import { useState, useCallback } from 'react';
import { ItemSuggestion } from '@/types/item';
import {
  fetchItems,
  fetchItemIds,
  fetchHeroItemPopularity,
  fetchHeroItemsAgainstEnemies,
} from '@/services/opendota-api';
import { scoreItems } from '@/services/item-scoring';

interface UseItemSuggestionsResult {
  itemSuggestions: Map<number, ItemSuggestion[]>;
  loading: boolean;
  error: string | null;
  fetchForHeroes: (heroIds: number[], enemyHeroIds: number[]) => Promise<Map<number, ItemSuggestion[]>>;
}

export function useItemSuggestions(): UseItemSuggestionsResult {
  const [itemSuggestions, setItemSuggestions] = useState<Map<number, ItemSuggestion[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForHeroes = useCallback(async (
    heroIds: number[],
    enemyHeroIds: number[],
  ): Promise<Map<number, ItemSuggestion[]>> => {
    try {
      setLoading(true);
      setError(null);

      const [items, itemIds] = await Promise.all([
        fetchItems(),
        fetchItemIds(),
      ]);

      const results = new Map<number, ItemSuggestion[]>();

      const heroFetches = heroIds.slice(0, 5).map(async (heroId) => {
        try {
          const [popularity, enemyData] = await Promise.all([
            fetchHeroItemPopularity(heroId),
            enemyHeroIds.length > 0
              ? fetchHeroItemsAgainstEnemies(heroId, enemyHeroIds).catch(() => null)
              : Promise.resolve(null),
          ]);

          const suggestions = scoreItems(popularity, enemyData, items, itemIds);
          results.set(heroId, suggestions);
        } catch {
          // Skip hero if item data fails — not critical
        }
      });

      await Promise.all(heroFetches);
      setItemSuggestions(results);
      return results;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load item suggestions';
      setError(message);
      return new Map();
    } finally {
      setLoading(false);
    }
  }, []);

  return { itemSuggestions, loading, error, fetchForHeroes };
}
