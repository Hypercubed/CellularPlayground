import { BoundaryType, CA } from "./base";
import { UnboundedGrid } from "./grid";

import type { CAOptions } from "./base";
import type { CellState } from "./states";
import { readRle } from "../utils/rle";

export abstract class ElementaryCA<T extends CellState = CellState, O extends CAOptions = CAOptions> extends CA<T, O> {
  boundaryType: BoundaryType = BoundaryType.Infinite;

  refreshStats() {
    this.stats.Generation = this.step;
    this.stats.Alive = this.currentGrid.reduce((c, cell, x, y) => {
      if (y !== this.step) return c;
      return c + +(cell?.state !== this.emptyCell.state);
    }, 0);
  }

  doStep() {
    const updates = new UnboundedGrid<T>();

    // For each cell that changed on the previous tick
    this.changedGrid.forEach((_, x, y) => {
      if (y !== this.step) return;

        // for each neighbor in range
        for (let p =-this.neighborhoodRange; p <= this.neighborhoodRange; p++) {
          const [xx, yy] = this.getPosition(x + p, this.step + 1);

          // Cell was already visited, skip
          if (updates.has(xx, yy)) continue;

          const c = this.get(xx, yy);
          const n = this.getNextCell(xx, yy) || c;
  
          updates.set(xx, yy, n);
        }
    });
    
    this.changedGrid.clear();

    // Only update what has changed
    updates.forEach((s, x, y) => this.set(x, y, s));

    this.step++;
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