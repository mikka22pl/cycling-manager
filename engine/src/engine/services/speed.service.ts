import { Cyclist } from '../models/cyclist';
import { Segment } from '../models/segment';
import { SeededRandom } from '../utils/random';

export const BASE_SPEED = 42; // km/h flat baseline

/**
 * Computes instantaneous speed for a cyclist in a given segment.
 * Pure function – no side effects.
 */
export function computeSpeed(
  cyclist: Cyclist,
  segment: Segment,
  groupSize: number,
  effort: number,
  rng: SeededRandom,
  formFactor = 1.0,
): number {
  const { performance, climbing, sprint } = cyclist.stats;
  const { energy } = cyclist.dynamic;

  // --- Terrain factor ---
  const gradientEffect = 1 - segment.gradient / 10;
  let terrainFactor: number;
  if (segment.type === 'climb') {
    terrainFactor = (climbing / 100) * Math.max(0.3, gradientEffect);
  } else if (segment.type === 'descent') {
    terrainFactor = 1.1 + Math.abs(segment.gradient) / 20;
  } else {
    // flat – strength proxy via performance
    terrainFactor = 0.85 + (performance / 100) * 0.15;
  }

  // --- Drafting: reduces effective effort cost, modelled as energy bonus ---
  const draftingBonus = groupSize >= 5 ? 1.25 : groupSize >= 2 ? 1.1 : 1;
  const effectiveEnergy = Math.min((energy / 100) * draftingBonus, 1);

  // --- Power ---
  const power = effort * (performance / 100) * effectiveEnergy;

  // --- Sprint boost (<3 km is handled by effort=1.2, but add stat bonus) ---
  const sprintBoost = 0; // injected upstream via effort

  // --- Final speed ---
  const rawSpeed = BASE_SPEED * power * terrainFactor * (1 + sprintBoost);

  // Wind effect
  let windFactor = 1;
  if (segment.wind) {
    const w = segment.wind.strength;
    if (segment.wind.direction === 'head') windFactor = 1 - w * 0.1;
    else if (segment.wind.direction === 'tail') windFactor = 1 + w * 0.08;
    // cross-wind reduces efficiency slightly
    else windFactor = 1 - w * 0.04;
  }

  // ±15% random variation
  const randomFactor = rng.range(0.85, 1.15);

  return Math.max(5, rawSpeed * windFactor * randomFactor * formFactor);
}
