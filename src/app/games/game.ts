import { matrix } from './utils';

export interface CellState {
  state: string;
  token: string;
}

export class Game<T extends CellState = CellState> {
  states: T[];
  pallet: T[];
  size: number;
  grid: T[][];
  stats: Record<string, any>;

  clearGridWith(c: T) {
    this.grid = matrix(this.size, this.size, c);
  }

  neighborhoodCount(
    y: number,
    x: number,
    s: T,
    X: T[][] = this.grid
  ): number {
    let c = 0;
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        c += +(this.getCell(q, p, X)?.state === s.state);
      }
    }
    return c;
  }

  regionCount(
    y: number,
    x: number,
    R: number,
    s: T,
    X: T[][] = this.grid
  ): number {
    let c = 0;
    for (let p = x - R; p <= x + R; p++) {
      for (let q = y - R; q <= y + R; q++) {
        const r = Math.sqrt((p - x)**2 + (q - y)**2);
        if (r <= R) {
          c += +(this.getCell(q, p, X)?.state === s.state);
        }
      }
    }
    return c;
  }

  worldCount(s: T, X: T[][] = this.grid): number {
    let c = 0;
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        c += +(this.getCell(j, i, X).state === s.state);
      }
    }
    return c;
  }

  getCell(y: number, x: number, X: T[][] = this.grid): T {
    if (x < 0 || y < 0) return null;
    if (x >= this.size || y >= this.size) return null;
    return X[y][x] as T;
  }

  setCell(y: number, x: number, s: T, X: T[][] = this.grid) {
    if (x < 0 || y < 0) return null;
    if (x >= this.size || y >= this.size) return null;
    X[y][x] = s;
  }

  randomState(): CellState {
    return this.states[Math.floor(this.states.length * Math.random())];
  }
}

export function createState<T extends CellState = CellState>(state: string, token = state): Readonly<CellState> {
  return {
    state,
    token
  }
}
