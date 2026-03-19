"use client";

import { useState, useCallback } from 'react';
import { useHeroes } from './useHeroes';
import { usePlayerHeroPool } from './usePlayerHeroPool';
import { useRecommendations } from './useRecommendations';
import { MAX_ENEMY_HEROES } from '@/constants';

export function usePickerState() {
  const { heroes, loading: heroesLoading, error: heroesError } = useHeroes();
  const { heroPool, loading: poolLoading, error: poolError, load: loadPool } = usePlayerHeroPool();
  const { recommendations, loading: recsLoading, error: recsError, calculate } = useRecommendations();

  const [selectedEnemyIds, setSelectedEnemyIds] = useState<number[]>([]);
  const [isPoolLoaded, setIsPoolLoaded] = useState(false);

  const handleLoadProfile = useCallback(async (accountId: string) => {
    const success = await loadPool(accountId, heroes);
    setIsPoolLoaded(success);
  }, [loadPool, heroes]);

  const handleSelectEnemy = useCallback((heroId: number) => {
    setSelectedEnemyIds(prev => {
      if (prev.length >= MAX_ENEMY_HEROES || prev.includes(heroId)) {
        return prev;
      }
      return [...prev, heroId];
    });
  }, []);

  const handleRemoveEnemy = useCallback((heroId: number) => {
    setSelectedEnemyIds(prev => prev.filter(id => id !== heroId));
  }, []);

  const handleSuggestPicks = useCallback(async () => {
    await calculate(heroPool, selectedEnemyIds, heroes);
  }, [calculate, heroPool, selectedEnemyIds, heroes]);

  const canSuggest = isPoolLoaded && heroPool.length > 0 && selectedEnemyIds.length > 0 && !recsLoading;

  return {
    heroes,
    heroesLoading,
    heroesError,
    heroPool,
    poolLoading,
    poolError,
    recommendations,
    recsLoading,
    recsError,
    selectedEnemyIds,
    isPoolLoaded,
    canSuggest,
    handleLoadProfile,
    handleSelectEnemy,
    handleRemoveEnemy,
    handleSuggestPicks,
  };
}
