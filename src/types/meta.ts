export interface HeroStats {
  id: number;
  name: string;
  pro_pick: number;
  pro_win: number;
  pro_ban: number;
  [key: string]: number | string;
}

export type MetaTier = 'S' | 'A' | 'B' | 'C' | 'D';

export interface HeroMetaScore {
  heroId: number;
  currentWinRate: number;
  pickRate: number;
  proPresence: number;
  metaScore: number;
  tier: MetaTier;
}
