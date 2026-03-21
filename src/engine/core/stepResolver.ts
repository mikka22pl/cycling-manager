/**
 * Determines the simulation step size (km) based on remaining distance.
 * Granularity increases as the race approaches the finish.
 */
export function resolveStepDistance(remainingKm: number): number {
  if (remainingKm <= 10) return 1;
  if (remainingKm <= 50) return 5;
  return 10;
}
