export function readRle(rle: string): {
  grid: string[][];
  height: number;
  width: number;
} {
  let height = 0;
  let width = 0;

  let x = 0;
  let y = 0;
  let grid = [[]];

  const lines = rle
    .split(/\n/)
    .filter((l) => !l.startsWith('#'))
    .filter((l) => l.length > 0)
    .map((l) => l.trim().replace(/\!$/, ''))
    .join('$');

  const r = lines.split('$');

  for (const c of r) {
    const m = c.matchAll(/(\d*)(\D)/g);
    for (let [_, count, token] of m) {
      for (let i = 0; i < +(count || 1); i++) {
        grid[y][x++] = token;
        if (x > width) {
          width = x;
        }
      }
    }

    x = 0;
    y++;
    grid[y] = [];
    if (y > height) {
      height = y;
    }
  }

  return { grid, height, width };
}
