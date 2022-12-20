export function matrix<T>(length: number, n: number, s: T): T[][] {
  return Array.from({ length }, () => new Array(n).fill(s));
}

export function clone<T>(A: T[][]): T[][] {
  return A.map((arr) => arr.slice());
}

export function setCell<T>(y: number, x: number, s: T, grid: T[][]): void {
  if (x < 0 || y < 0) return null;
  if (x >= grid[0].length || y >= grid.length) return null;
  grid[y][x] = s;
}

export function getCell<T>(y: number, x: number, grid: T[][]): T {
  if (x < 0 || y < 0) return null;
  if (x >= grid[0].length || y >= grid.length) return null;
  return grid[y][x] as T;
}
