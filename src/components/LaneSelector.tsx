"use client";

import { LaneType } from '@/types/lane';

interface LaneSelectorProps {
  value: LaneType;
  onChange: (lane: LaneType) => void;
}

const LANES: { label: string; value: LaneType }[] = [
  { label: 'Safe Lane', value: 'safe' },
  { label: 'Offlane', value: 'off' },
  { label: 'Mid', value: 'mid' },
  { label: 'Any', value: null },
];

export default function LaneSelector({ value, onChange }: LaneSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-300">Lane</label>
      <div className="flex gap-2">
        {LANES.map(lane => {
          const isActive = value === lane.value;
          return (
            <button
              key={lane.label}
              type="button"
              onClick={() => onChange(lane.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              {lane.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
