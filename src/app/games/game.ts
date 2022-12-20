import { matrix, setCell, getCell } from "./utils";

export interface CellState {
  state: string;
  token: string;
}

export abstract class Game<T extends CellState = CellState> {
  states: T[];
  pallet: T[];
  size: number;
  stats: Record<string, any>;

  get grid() {
    return this.currentGrid;
  }

  private currentGrid: T[][];
  private nextGrid: T[][];

  abstract reset(): void;
  abstract refreshStats(): void;

  fillWith(c: T) {
    this.currentGrid = matrix(this.size, this.size, c);
    this.nextGrid = matrix(this.size, this.size, c);
  }

  neighborhoodCountWhen(y: number, x: number, s: T): number {
    let c = 0;
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        c += +(this.getCell(q, p)?.state === s.state);
      }
    }
    return c;
  }

  regionCountWhen(y: number, x: number, R: number, s: T): number {
    let c = 0;
    for (let p = x - R; p <= x + R; p++) {
      for (let q = y - R; q <= y + R; q++) {
        const r = Math.abs(p - x) + Math.abs(q - y); // Manhattan distance
        if (r <= R) {
          c += +(this.getCell(q, p)?.state === s.state);
        }
      }
    }
    return c;
  }

  worldCountWhen(s: T): number {
    let c = 0;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        c += +(this.getCell(j, i).state === s.state);
      }
    }
    return c;
  }

  getCell(y: number, x: number): T {
    return getCell(y, x, this.currentGrid);
  }

  immediatelySetCell(y: number, x: number, s: T) {
    setCell(y, x, s, this.currentGrid);
    this.refreshStats();
  }

  doStep() {
    const changes = [];

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const n = this.getNextCell(y, x);
        if (n !== this.currentGrid[y][x]) {
          changes.push([y, x, n]);
        }
      }
    }

    // Only update what has changed
    for (const [y, x, n] of changes) {
      this.currentGrid[y][x] = n;
    }

    this.stats.Step++;

    this.refreshStats();
  }

  protected getNextField() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        return this.getNextCell(y, x);
      }
    }
  }

  protected getNextCell(y: number, x: number) {
    return this.getCell(y, x);
  }
}

export function createState<T extends CellState = CellState>(
  state: string,
  token = state
): Readonly<CellState> {
  return {
    state,
    token,
  };
}
