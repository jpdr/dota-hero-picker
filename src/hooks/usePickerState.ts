"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useHeroes } from './useHeroes';
import { usePlayerHeroPool } from './usePlayerHeroPool';
import { useRecommendations } from './useRecommendations';
import { useItemSuggestions } from './useItemSuggestions';
import { Hero } from '@/types/hero';
import { LaneType, HeroLaneData } from '@/types/lane';
import { HeroMetaScore } from '@/types/meta';
import { Recommendation } from '@/types/recommendation';
import { fetchLaneRoles, fetchHeroStats } from '@/services/opendota-api';
import { buildLaneDataMap } from '@/services/scoring';
import { computeMetaScores } from '@/services/meta';
import { MAX_ENEMY_HEROES, MAX_ALLY_HEROES } from '@/constants';

export function usePickerState() {
  const { heroes, loading: heroesLoading, error: heroesError } = useHeroes();
  const { heroPool, loading: poolLoading, error: poolError, load: loadPool } = usePlayerHeroPool();
  const { recommendations, loading: recsLoading, error: recsError, calculate } = useRecommendations();
  const { itemSuggestions, loading: itemsLoading, fetchForHeroes: fetchItems } = useItemSuggestions();

  const [allySlots, setAllySlots] = useState<(Hero | null)[]>([null, null, null, null, null]);
  const [enemySlots, setEnemySlots] = useState<(Hero | null)[]>([null, null, null, null, null]);
  const [selectionMode, setSelectionMode] = useState<'ally' | 'enemy'>('enemy');
  const [isPoolLoaded, setIsPoolLoaded] = useState(false);
  const [laneType, setLaneType] = useState<LaneType>(null);
  const [laneDataMap, setLaneDataMap] = useState<Map<number, HeroLaneData>>(new Map());
  const [laneDataLoading, setLaneDataLoading] = useState(true);
  const [metaScores, setMetaScores] = useState<Map<number, HeroMetaScore>>(new Map());
  const [metaLoading, setMetaLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchLaneRoles()
      .then(data => setLaneDataMap(buildLaneDataMap(data)))
      .catch(() => {})
      .finally(() => setLaneDataLoading(false));
  }, []);

  useEffect(() => {
    fetchHeroStats()
      .then(data => setMetaScores(computeMetaScores(data)))
      .catch(() => {})
      .finally(() => setMetaLoading(false));
  }, []);

  const allyHeroIds = useMemo(
    () => allySlots.filter((h): h is Hero => h !== null).map(h => h.id),
    [allySlots],
  );

  const enemyHeroIds = useMemo(
    () => enemySlots.filter((h): h is Hero => h !== null).map(h => h.id),
    [enemySlots],
  );

  const allPickedIds = useMemo(
    () => [...allyHeroIds, ...enemyHeroIds],
    [allyHeroIds, enemyHeroIds],
  );

  const recommendedHeroIds = useMemo(
    () => recommendations.map(r => r.hero.id),
    [recommendations],
  );

  const handleLoadProfile = useCallback(async (accountId: string) => {
    const success = await loadPool(accountId, heroes);
    setIsPoolLoaded(success);
  }, [loadPool, heroes]);

  const heroMap = useMemo(() => new Map(heroes.map(h => [h.id, h])), [heroes]);

  const handlePickHero = useCallback((heroId: number) => {
    const hero = heroMap.get(heroId);
    if (!hero || allPickedIds.includes(heroId)) {
      return;
    }

    if (selectionMode === 'ally') {
      setAllySlots(prev => {
        const firstEmpty = prev.indexOf(null);
        if (firstEmpty === -1) return prev;
        const next = [...prev];
        next[firstEmpty] = hero;
        // Auto-switch if all ally slots filled after this pick
        const remainingEmpty = next.filter(s => s === null).length;
        if (remainingEmpty === 0) {
          setSelectionMode('enemy');
        }
        return next;
      });
    } else {
      setEnemySlots(prev => {
        const firstEmpty = prev.indexOf(null);
        if (firstEmpty === -1) return prev;
        const next = [...prev];
        next[firstEmpty] = hero;
        const remainingEmpty = next.filter(s => s === null).length;
        if (remainingEmpty === 0) {
          setSelectionMode('ally');
        }
        return next;
      });
    }
  }, [heroMap, selectionMode, allPickedIds]);

  const handleRemoveAlly = useCallback((index: number) => {
    setAllySlots(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }, []);

  const handleRemoveEnemy = useCallback((index: number) => {
    setEnemySlots(prev => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }, []);

  const handlePickRecommendation = useCallback((heroId: number) => {
    const hero = heroMap.get(heroId);
    if (!hero || allPickedIds.includes(heroId)) {
      return;
    }
    setAllySlots(prev => {
      const firstEmpty = prev.indexOf(null);
      if (firstEmpty === -1) return prev;
      const next = [...prev];
      next[firstEmpty] = hero;
      return next;
    });
  }, [heroMap, allPickedIds]);

  // Auto-recalculate recommendations when picks change
  useEffect(() => {
    if (!isPoolLoaded || heroPool.length === 0 || (enemyHeroIds.length === 0 && allyHeroIds.length === 0)) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      calculate(heroPool, enemyHeroIds, heroes, laneDataMap, laneType, allyHeroIds, metaScores);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isPoolLoaded, heroPool, enemyHeroIds, allyHeroIds, heroes, laneDataMap, laneType, metaScores, calculate]);

  useEffect(() => {
    if (recommendations.length > 0) {
      const heroIds = recommendations.map(r => r.hero.id);
      fetchItems(heroIds, enemyHeroIds);
    }
  }, [recommendations, enemyHeroIds, fetchItems]);

  const enrichedRecommendations: Recommendation[] = recommendations.map(rec => ({
    ...rec,
    itemSuggestions: itemSuggestions.get(rec.hero.id),
  }));

  return {
    heroes,
    heroesLoading,
    heroesError,
    heroPool,
    poolLoading,
    poolError,
    recommendations: enrichedRecommendations,
    recsLoading,
    recsError,
    allySlots,
    enemySlots,
    allyHeroIds,
    enemyHeroIds,
    allPickedIds,
    recommendedHeroIds,
    selectionMode,
    isPoolLoaded,
    laneType,
    laneDataLoading,
    metaLoading,
    itemsLoading,
    setLaneType,
    setSelectionMode,
    handleLoadProfile,
    handlePickHero,
    handleRemoveAlly,
    handleRemoveEnemy,
    handlePickRecommendation,
  };
}
