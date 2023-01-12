import { BoundaryType, CA } from './base';
import { UnboundedGrid } from './grid';

import type { CAOptions } from './base';
import type { CellState } from './states';
import { readRle } from '../utils/rle';

export abstract class OCA<
  T extends CellState = CellState,
  O extends CAOptions = CAOptions
> extends CA<T, O> {
  boundaryType: BoundaryType = BoundaryType.Infinite;

  refreshStats() {
    this.stats.Generation = this.step;
    this.stats.Alive = this.currentGrid.reduce((c, cell, x, y) => {
      if (y !== this.step) return c;
      return c + +(cell?.state !== this.emptyCell.state);
    }, 0);
  }

  protected doCell(x: number, y: number, R: number) {
    if (y !== this.step) return;

    // for each neighbor in range
    for (let p = -R; p <= R; p++) {
      const [xx, yy] = this.getPosition(x + p, this.step + 1);

      // Cell was already visited, skip
      if (this.changedGrid.has(xx, yy)) continue;

      const c = this.get(xx, yy);
      const n = this.getNextCell(c, xx, yy) || c;
      this.setNext(xx, yy, n);
    }
  }

  loadRLE(rle: string) {
    this.clearGrid();
    if (!rle) return;

    const { grid, width } = readRle(rle);

    // Center the pattern
    let dx = Math.floor((this.width - width) / 2);
    let dy = 0;

    for (let j = 0; j < grid.length; j++) {
      for (let i = 0; i <= grid[j].length; i++) {
        if (grid?.[j]?.[i]) {
          const state = this.tokenToState(grid[j][i]);
          this.set(i + dx, j + dy, state);
        }
      }
    }
  }
}
