"use client";

import { useState, useCallback, useEffect } from 'react';
import { useHeroes } from './useHeroes';
import { usePlayerHeroPool } from './usePlayerHeroPool';
import { useRecommendations } from './useRecommendations';
import { LaneType, HeroLaneData } from '@/types/lane';
import { fetchLaneRoles } from '@/services/opendota-api';
import { buildLaneDataMap } from '@/services/scoring';
import { MAX_ENEMY_HEROES } from '@/constants';

export function usePickerState() {
  const { heroes, loading: heroesLoading, error: heroesError } = useHeroes();
  const { heroPool, loading: poolLoading, error: poolError, load: loadPool } = usePlayerHeroPool();
  const { recommendations, loading: recsLoading, error: recsError, calculate } = useRecommendations();

  const [selectedEnemyIds, setSelectedEnemyIds] = useState<number[]>([]);
  const [isPoolLoaded, setIsPoolLoaded] = useState(false);
  const [laneType, setLaneType] = useState<LaneType>(null);
  const [laneDataMap, setLaneDataMap] = useState<Map<number, HeroLaneData>>(new Map());
  const [laneDataLoading, setLaneDataLoading] = useState(true);

  useEffect(() => {
    fetchLaneRoles()
      .then(data => setLaneDataMap(buildLaneDataMap(data)))
      .catch(() => {})
      .finally(() => setLaneDataLoading(false));
  }, []);

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
    await calculate(heroPool, selectedEnemyIds, heroes, laneDataMap, laneType);
  }, [calculate, heroPool, selectedEnemyIds, heroes, laneDataMap, laneType]);

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
    laneType,
    laneDataLoading,
    setLaneType,
    handleLoadProfile,
    handleSelectEnemy,
    handleRemoveEnemy,
    handleSuggestPicks,
  };
}
