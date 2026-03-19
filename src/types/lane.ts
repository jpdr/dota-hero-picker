export type LaneType = 'safe' | 'off' | 'mid' | null;

// OpenDota lane_role values: 1=Safe, 2=Mid, 3=Off, 4=Jungle
export const LANE_ROLE_MAP: Record<number, LaneType> = {
  1: 'safe',
  2: 'mid',
  3: 'off',
};

export interface LaneRoleStat {
  hero_id: number;
  lane_role: number;
  time: number;
  games: string;
  wins: string;
}

export interface HeroLaneData {
  heroId: number;
  lanes: { lane: LaneType; games: number; winRate: number }[];
  primaryLane: LaneType;
}
