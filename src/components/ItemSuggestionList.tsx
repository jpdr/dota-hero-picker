"use client";

import { ItemSuggestion } from '@/types/item';

const ITEM_IMAGE_CDN = 'https://cdn.cloudflare.steamstatic.com';

interface ItemSuggestionListProps {
  items: ItemSuggestion[];
  loading?: boolean;
}

export default function ItemSuggestionList({ items, loading }: ItemSuggestionListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-400">Suggested Items</span>
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-11 animate-pulse rounded bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-400">Suggested Items</span>
      <div className="flex flex-wrap gap-1">
        {items.map(suggestion => (
          <div key={suggestion.item.id} className="group relative">
            <img
              src={`${ITEM_IMAGE_CDN}${suggestion.item.img}`}
              alt={suggestion.item.dname}
              className="h-8 w-11 rounded border border-gray-600 object-cover"
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-gray-200 shadow-lg group-hover:block">
              <div className="font-medium">{suggestion.item.dname}</div>
              <div className="text-gray-400">{suggestion.item.cost} gold</div>
              <div className="text-cyan-400">{suggestion.reason}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
