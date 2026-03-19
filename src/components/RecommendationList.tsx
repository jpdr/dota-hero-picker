"use client";

import { Recommendation } from '@/types/recommendation';
import RecommendationCard from './RecommendationCard';

interface RecommendationListProps {
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg bg-gray-800 border border-gray-700">
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

export default function RecommendationList({ recommendations, loading, error }: RecommendationListProps) {
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
        Select enemy heroes and click &quot;Suggest Picks&quot; to get recommendations.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((rec, i) => (
        <RecommendationCard key={rec.hero.id} recommendation={rec} rank={i + 1} />
      ))}
    </div>
  );
}
