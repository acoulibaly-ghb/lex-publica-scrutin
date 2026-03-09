export interface PopulationRange {
  min: number;
  max: number;
  seats: number;
}

export const POPULATION_SEATS_MAPPING: PopulationRange[] = [
  { min: 0, max: 99, seats: 7 },
  { min: 100, max: 499, seats: 11 },
  { min: 500, max: 1499, seats: 15 },
  { min: 1500, max: 2499, seats: 19 },
  { min: 2500, max: 3499, seats: 23 },
  { min: 3500, max: 4999, seats: 27 },
  { min: 5000, max: 9999, seats: 29 },
  { min: 10000, max: 19999, seats: 33 },
  { min: 20000, max: 29999, seats: 35 },
  { min: 30000, max: 39999, seats: 39 },
  { min: 40000, max: 49999, seats: 43 },
  { min: 50000, max: 59999, seats: 45 },
  { min: 60000, max: 79999, seats: 49 },
  { min: 80000, max: 99999, seats: 53 },
  { min: 100000, max: 149999, seats: 55 },
  { min: 150000, max: 199999, seats: 59 },
  { min: 200000, max: 249999, seats: 61 },
  { min: 250000, max: 299999, seats: 65 },
  { min: 300000, max: Infinity, seats: 69 },
];

export function getSeatsFromPopulation(population: number): number {
  const range = POPULATION_SEATS_MAPPING.find(
    (r) => population >= r.min && population <= r.max
  );
  return range ? range.seats : 7;
}

export function getPopulationRangeFromSeats(seats: number): PopulationRange | undefined {
  return POPULATION_SEATS_MAPPING.find((r) => r.seats === seats);
}

export function formatPopulationRange(range: PopulationRange): string {
  if (range.max === Infinity) return `Plus de ${range.min.toLocaleString()} habitants`;
  if (range.min === 0) return `Moins de ${range.max + 1} habitants`;
  return `De ${range.min.toLocaleString()} à ${range.max.toLocaleString()} habitants`;
}
