import { Hero } from './hero';
import { ItemSuggestion } from './item';
import { TimingTag } from '@/services/timing';
import { MetaTier } from './meta';

export interface HeroPoolEntry {
  hero: Hero;
  games: number;
  wins: number;
  winRate: number;
}

export interface MatchupResult {
  enemyHero: Hero;
  advantage: number;
  gamesPlayed: number;
}

export interface SynergyResult {
  allyHero: Hero;
  synergy: number;
  gamesPlayed: number;
}

export interface Recommendation {
  hero: Hero;
  compositeScore: number;
  playerWinRate: number;
  averageMatchupAdvantage: number;
  averageAllySynergy: number;
  matchesPlayed: number;
  matchupDetails: MatchupResult[];
  synergyDetails: SynergyResult[];
  reasons: string[];
  itemSuggestions?: ItemSuggestion[];
  timingTag?: TimingTag;
  metaTier?: MetaTier;
}
