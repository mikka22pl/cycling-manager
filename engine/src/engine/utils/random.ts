/**
 * Seeded pseudo-random number generator (mulberry32).
 * Produces deterministic sequences when a seed is provided.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.seed |= 0;
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let z = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    z = (z ^ (z + Math.imul(z ^ (z >>> 7), 61 | z))) >>> 0;
    return (z ^ (z >>> 14)) / 0x100000000;
  }

  /** Returns a float in [min, max] */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/** Creates a SeededRandom from a seed or a random one if undefined. */
export function createRng(seed?: number): SeededRandom {
  return new SeededRandom(seed ?? Math.floor(Math.random() * 0xffffffff));
}
