import { Cyclist } from '../models/cyclist';
import { Segment } from '../models/segment';
import { SeededRandom } from '../utils/random';

/**
 * Applies fatigue and updates energy for a cyclist.
 * Returns new dynamic state (immutable-style – caller should spread).
 */
export function computeFatigueUpdate(
  cyclist: Cyclist,
  effort: number,
  segment: Segment,
  rng: SeededRandom,
): { fatigue: number; energy: number } {
  const { stamina, recovery } = cyclist.stats;

  const terrainDifficulty = 1 + Math.max(0, segment.gradient / 5);

  // Quadratic with effort: high effort grows fatigue fast
  const baseFatigueIncrease =
    Math.pow(effort, 2) *
    terrainDifficulty *
    (1 - recovery / 100);

  // ±2% random fatigue variation
  const fatigueIncrease = baseFatigueIncrease * rng.range(0.98, 1.02);

  // Recovery bonus when coasting (effort < 1)
  const recoveryBonus = (recovery / 100) * (1 - effort) * 2;

  const newFatigue = cyclist.dynamic.fatigue + fatigueIncrease - recoveryBonus;
  const newEnergy = Math.max(0, Math.min(100, stamina - newFatigue));

  return { fatigue: Math.max(0, newFatigue), energy: newEnergy };
}
