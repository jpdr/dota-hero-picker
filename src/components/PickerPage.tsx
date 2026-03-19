"use client";

import { usePickerState } from '@/hooks/usePickerState';
import AccountIdInput from './AccountIdInput';
import HeroPoolDisplay from './HeroPoolDisplay';
import DraftBoard from './DraftBoard';
import SelectionModeToggle from './SelectionModeToggle';
import LaneSelector from './LaneSelector';
import HeroGrid from './HeroGrid';
import RecommendationList from './RecommendationList';

export default function PickerPage() {
  const {
    heroes,
    heroesLoading,
    heroesError,
    heroPool,
    poolLoading,
    poolError,
    recommendations,
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
    itemsLoading,
    setLaneType,
    setSelectionMode,
    handleLoadProfile,
    handlePickHero,
    handleRemoveAlly,
    handleRemoveEnemy,
    handlePickRecommendation,
  } = usePickerState();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-100">Dota 2 Hero Picker</h1>

      {heroesError && (
        <div className="mb-4 rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-red-300">
          Failed to load hero data: {heroesError}
        </div>
      )}

      {heroesLoading && (
        <div className="mb-4 text-gray-400">Loading hero data...</div>
      )}

      <div className="flex flex-col gap-6">
        <AccountIdInput onLoad={handleLoadProfile} loading={poolLoading} />

        {poolError && (
          <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-red-300">
            {poolError}
          </div>
        )}

        <DraftBoard
          allies={allySlots}
          enemies={enemySlots}
          onRemoveAlly={handleRemoveAlly}
          onRemoveEnemy={handleRemoveEnemy}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <SelectionModeToggle
            mode={selectionMode}
            onChange={setSelectionMode}
            allyCount={allyHeroIds.length}
            enemyCount={enemyHeroIds.length}
          />
          <LaneSelector value={laneType} onChange={setLaneType} />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-200">Recommendations</h2>
          <RecommendationList
            recommendations={recommendations}
            loading={recsLoading}
            error={recsError}
            itemsLoading={itemsLoading}
            onPickHero={handlePickRecommendation}
          />
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-200">Hero Pool</h2>
          <HeroGrid
            heroes={heroes}
            pickedHeroIds={allPickedIds}
            recommendedHeroIds={recommendedHeroIds}
            selectionMode={selectionMode}
            onPickHero={handlePickHero}
          />
        </div>

        {isPoolLoaded && <HeroPoolDisplay heroPool={heroPool} />}
      </div>
    </div>
  );
}
