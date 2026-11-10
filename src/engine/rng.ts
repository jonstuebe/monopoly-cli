/** mulberry32: small, seedable PRNG so games are reproducible in tests. */
export function nextRandom(seed: number): [value: number, seed: number] {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, next];
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
