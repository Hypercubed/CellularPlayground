export function matrix<T>(length: number, n: number, s: T): T[][] {
  return Array.from({ length }, () => new Array(n).fill(s));
}

export function clone<T>(A: T[][]): T[][] {
  return A.map((arr) => arr.slice());
}
