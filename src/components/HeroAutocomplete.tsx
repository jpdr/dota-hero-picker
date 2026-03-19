"use client";

import { useState, useRef, useEffect } from 'react';
import { Hero } from '@/types/hero';

interface HeroAutocompleteProps {
  heroes: Hero[];
  selectedIds: number[];
  onSelect: (heroId: number) => void;
  onRemove: (heroId: number) => void;
}

const CDN_BASE = 'https://api.opendota.com';

export default function HeroAutocomplete({ heroes, selectedIds, onSelect, onRemove }: HeroAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.length > 0
    ? heroes.filter(h =>
        h.localized_name.toLowerCase().includes(query.toLowerCase()) &&
        !selectedIds.includes(h.id)
      ).slice(0, 10)
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedHeroes = heroes.filter(h => selectedIds.includes(h.id));

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-300">
        Enemy Heroes (max 3)
      </label>
      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={selectedIds.length >= 3 ? 'Max enemies selected' : 'Search for a hero...'}
          disabled={selectedIds.length >= 3}
          className="w-full rounded-lg bg-gray-800 px-4 py-2 text-gray-100 border border-gray-700 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
        />
        {isOpen && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-lg bg-gray-800 border border-gray-700 shadow-lg">
            {filtered.map(hero => (
              <li key={hero.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(hero.id);
                    setQuery('');
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-gray-100 hover:bg-gray-700 transition-colors"
                >
                  <img
                    src={`${CDN_BASE}${hero.icon}`}
                    alt={hero.localized_name}
                    className="h-6 w-6 object-contain"
                  />
                  <span>{hero.localized_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selectedHeroes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedHeroes.map(hero => (
            <span
              key={hero.id}
              className="flex items-center gap-2 rounded-full bg-gray-700 px-3 py-1 text-sm text-gray-200"
            >
              <img
                src={`${CDN_BASE}${hero.icon}`}
                alt={hero.localized_name}
                className="h-4 w-4 object-contain"
              />
              {hero.localized_name}
              <button
                type="button"
                onClick={() => onRemove(hero.id)}
                className="ml-1 text-gray-400 hover:text-red-400 transition-colors"
                aria-label={`Remove ${hero.localized_name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
