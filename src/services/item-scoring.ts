import { DotaItem, ItemPopularity, ItemSuggestion, ExplorerResponse } from '@/types/item';

const MIN_ITEM_COST = 1000;
const MAX_SUGGESTIONS = 5;

interface ScoredItem {
  itemKey: string;
  item: DotaItem;
  popularity: number;
  phase: 'early' | 'mid' | 'late';
  enemyWinRate?: number;
  enemyGames?: number;
  score: number;
}

function resolveItem(
  numericId: string,
  itemIds: Record<string, string>,
  items: Record<string, DotaItem>,
): DotaItem | null {
  const key = itemIds[numericId];
  if (!key) {
    return null;
  }
  const item = items[key];
  if (!item || !item.dname) {
    return null;
  }
  return item;
}

export function scoreItems(
  popularity: ItemPopularity,
  enemyItemData: ExplorerResponse | null,
  items: Record<string, DotaItem>,
  itemIds: Record<string, string>,
): ItemSuggestion[] {
  const candidates = new Map<string, ScoredItem>();

  const phases: { data: Record<string, number>; phase: 'early' | 'mid' | 'late' }[] = [
    { data: popularity.early_game_items, phase: 'early' },
    { data: popularity.mid_game_items, phase: 'mid' },
    { data: popularity.late_game_items, phase: 'late' },
  ];

  for (const { data, phase } of phases) {
    for (const [numericId, pickCount] of Object.entries(data)) {
      const item = resolveItem(numericId, itemIds, items);
      if (!item || item.cost < MIN_ITEM_COST) {
        continue;
      }

      const existing = candidates.get(numericId);
      if (!existing || pickCount > existing.popularity) {
        candidates.set(numericId, {
          itemKey: numericId,
          item,
          popularity: pickCount,
          phase,
          score: pickCount,
        });
      }
    }
  }

  const enemyWinRates = new Map<number, { winRate: number; games: number }>();
  if (enemyItemData) {
    for (const row of enemyItemData.rows) {
      const games = parseInt(row.games, 10);
      const wins = parseInt(row.wins, 10);
      if (games > 0) {
        enemyWinRates.set(row.item_id, { winRate: wins / games, games });
      }
    }
  }

  for (const [numericId, candidate] of candidates) {
    const itemId = candidate.item.id;
    const enemyData = enemyWinRates.get(itemId);
    if (enemyData) {
      candidate.enemyWinRate = enemyData.winRate;
      candidate.enemyGames = enemyData.games;
      // Boost score: multiply by win rate factor (>50% = boost, <50% = penalty)
      candidate.score *= 1 + (enemyData.winRate - 0.5) * 2;
    }

    // Boost mid/late items over early items
    if (candidate.phase === 'late') {
      candidate.score *= 1.1;
    } else if (candidate.phase === 'mid') {
      candidate.score *= 1.05;
    }
  }

  const sorted = Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS);

  return sorted.map(c => {
    let reason = 'Popular on this hero';
    if (c.enemyWinRate !== undefined && c.enemyGames !== undefined && c.enemyGames >= 5) {
      reason = `${(c.enemyWinRate * 100).toFixed(0)}% win rate vs enemies`;
    }

    return {
      item: c.item,
      reason,
      winRate: c.enemyWinRate,
      popularity: c.popularity,
      phase: c.phase,
    };
  });
}
