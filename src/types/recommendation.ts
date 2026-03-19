import { Hero } from './hero';

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

export interface Recommendation {
  hero: Hero;
  compositeScore: number;
  playerWinRate: number;
  averageMatchupAdvantage: number;
  matchesPlayed: number;
  matchupDetails: MatchupResult[];
  reasons: string[];
}
