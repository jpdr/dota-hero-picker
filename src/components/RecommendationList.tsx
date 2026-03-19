"use client";

import { Recommendation } from '@/types/recommendation';
import RecommendationCard from './RecommendationCard';
import { SKELETON_COUNT } from '@/constants';

interface RecommendationListProps {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  itemsLoading?: boolean;
  onPickHero?: (heroId: number) => void;
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="w-64 flex-shrink-0 animate-pulse rounded-lg bg-gray-800 border border-gray-700">
          <div className="h-32 bg-gray-700 rounded-t-lg" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-2/3 rounded bg-gray-700" />
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded bg-gray-700" />
              <div className="h-8 flex-1 rounded bg-gray-700" />
              <div className="h-8 flex-1 rounded bg-gray-700" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-gray-700" />
              <div className="h-3 w-4/5 rounded bg-gray-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RecommendationList({ recommendations, loading, error, itemsLoading, onPickHero }: RecommendationListProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-red-300">
        {error}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Pick enemy heroes and load your profile to see recommendations.
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {recommendations.map((rec, i) => (
        <div key={rec.hero.id} className="w-64 flex-shrink-0">
          <RecommendationCard
            recommendation={rec}
            rank={i + 1}
            itemsLoading={itemsLoading}
            onClick={onPickHero ? () => onPickHero(rec.hero.id) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
