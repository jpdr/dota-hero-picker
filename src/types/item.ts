export interface DotaItem {
  id: number;
  dname: string;
  cost: number;
  img: string;
}

export interface ItemPopularity {
  start_game_items: Record<string, number>;
  early_game_items: Record<string, number>;
  mid_game_items: Record<string, number>;
  late_game_items: Record<string, number>;
}

export interface ItemSuggestion {
  item: DotaItem;
  reason: string;
  winRate?: number;
  popularity: number;
  phase: 'early' | 'mid' | 'late';
}

export interface ExplorerResponse {
  rows: { item_id: number; games: string; wins: string }[];
}
