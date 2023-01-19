import { CA } from './base';

import { readRle } from '../utils/rle';

import type { CAOptions } from './base';
import type { CellState } from './states';

// TODO: move this to base
export abstract class OCA<
  T extends CellState = CellState,
  O extends CAOptions = CAOptions
> extends CA<T, O> {
  refreshStats() {
    this.stats.Generation = this.step;
    this.stats.Alive = this.currentGrid.reduce((c, cell, x, y) => {
      if (y !== this.step) return c;
      return c + +(cell?.state !== this.emptyCell.state);
    }, 0);
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
