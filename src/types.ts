/**
 * Types for the election calculation engine
 */

export type ElectionRound = 1 | 2;
export type CityType = 'STANDARD' | 'PLM';

export interface CandidateList {
  id: string;
  name: string;
  votes: number;
  averageAge?: number;
}

export interface CalculationStep {
  title: string;
  description: string;
  details?: string[];
}

export interface DistributionResult {
  totalExpressedVotes: number;
  sumOfListVotes: number;
  totalSeats: number;
  majorityBonusSeats: number;
  remainingSeats: number;
  quotient: number;
  noMajorityInFirstRound?: boolean;
  admittedLists: {
    id: string;
    name: string;
    votes: number;
    percentage: number;
    isAdmitted: boolean;
    majorityBonus: number;
    quotientSeats: number;
    highestAverageSeats: number;
    totalSeats: number;
  }[];
  steps: CalculationStep[];
}
