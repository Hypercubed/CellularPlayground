export function readRle(rle: string): {
  grid: string[][];
  height: number;
  width: number;
} {
  // Remove comments and whitespace
  rle = rle
    .split(/\n/)
    .filter(l => !(l.startsWith('#') || l.startsWith('x =') || l.startsWith('x=')))
    .map(l => l.trim().replace(/\!$/, ''))
    .filter(l => l.length > 0)
    .join('')
    .replace(/\s/g, '');

  // Expand runs
  rle = rle.replace(/(\d+)(\D)/g, (_, d, c) => {
    const n = parseInt(d, 10);
    return c.repeat(n);
  });

  const grid = rle.split('$')
    .map((l) => l.split(''));
  
  const height = grid.length;
  const width = grid.reduce((acc, row) => Math.max(acc, row.length), 0);

  return { grid, height, width };
}
