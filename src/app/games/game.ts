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
  abstract doStats(): void;

  clearGridWith(c: T) {
    this.currentGrid = matrix(this.size, this.size, c);
    this.nextGrid = matrix(this.size, this.size, c);
  }

  neighborhoodCount(y: number, x: number, s: T): number {
    let c = 0;
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        c += +(this.getCell(q, p)?.state === s.state);
      }
    }
    return c;
  }

  regionCount(y: number, x: number, R: number, s: T): number {
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

  worldCount(s: T): number {
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

  setCell(y: number, x: number, s: T) {
    setCell(y, x, s, this.nextGrid);
  }

  dangerouslySetCell(y: number, x: number, s: T) {
    setCell(y, x, s, this.currentGrid);
  }

  doStep() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const n = this.getNextCell(y, x);
        this.setCell(y, x, n);
      }
    }

    const nextNextGrid = this.currentGrid;
    this.currentGrid = this.nextGrid;
    this.nextGrid = nextNextGrid;
    this.stats.Step++;
  }

  randomState(): CellState {
    return this.states[Math.floor(this.states.length * Math.random())];
  }

  getNextField() {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const n = this.getNextCell(j, i);
        this.setCell(j, i, n);
      }
    }
  }

  getNextCell(y: number, x: number) {
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
