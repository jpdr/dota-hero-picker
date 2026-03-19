"use client";

import { usePickerState } from '@/hooks/usePickerState';
import AccountIdInput from './AccountIdInput';
import HeroPoolDisplay from './HeroPoolDisplay';
import HeroAutocomplete from './HeroAutocomplete';
import LaneSelector from './LaneSelector';
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
    selectedEnemyIds,
    isPoolLoaded,
    canSuggest,
    laneType,
    setLaneType,
    handleLoadProfile,
    handleSelectEnemy,
    handleRemoveEnemy,
    handleSuggestPicks,
  } = usePickerState();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
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

        {isPoolLoaded && <HeroPoolDisplay heroPool={heroPool} />}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <HeroAutocomplete
              heroes={heroes}
              selectedIds={selectedEnemyIds}
              onSelect={handleSelectEnemy}
              onRemove={handleRemoveEnemy}
            />
          </div>
          <LaneSelector value={laneType} onChange={setLaneType} />
        </div>

        <button
          onClick={handleSuggestPicks}
          disabled={!canSuggest}
          className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {recsLoading ? 'Calculating...' : 'Suggest Picks'}
        </button>

        <RecommendationList
          recommendations={recommendations}
          loading={recsLoading}
          error={recsError}
        />
      </div>
    </div>
  );
}
