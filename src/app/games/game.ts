export interface CellState {
  state: string;
  token: string;
}

export interface GameOptions {
  sizeX: number;
  sizeY: number;
  continuous: boolean;
}

export const DEAD = createState("b");
export const ALIVE = createState("o");

export abstract class Game<T extends CellState = CellState> {
  states: T[];
  pallet: T[];

  sizeX: number;
  sizeY: number;
  stats: Record<string, any>;
  continuous: boolean = false;

  get grid() {
    return this.currentGrid;
  }

  protected currentGrid: T[][];

  constructor(options?: Partial<GameOptions>) {
    if (options) {
      Object.assign(this, options);
    }
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ALIVE as T);
  }

  reset() {
    this.fillWith(DEAD as T);
    this.stats.Step = 0;
  }

  fillWith(c: T | ((x: number, y: number) => T)) {
    this.currentGrid = makeGridWith(this.sizeX, this.sizeY, c);
    this.refreshStats();
  }

  getWorld(): T[] {
    let c = [];
    for (let x = 0; x < this.sizeX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        c.push(this.getCell(x, y));
      }
    }
    return c;
  }

  getWorldWhen(s: T): T[] {
    let c = [];
    for (let x = 0; x < this.sizeX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        const ss = this.getCell(x, y);
        if (ss?.state === s.state) c.push(ss);
      }
    }
    return c;
  }

  // Moore neighborhood
  getNeighborsWhen(x: number, y: number, s: T): T[] {
    let c = [];
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        if (p === x && q === y) continue;
        const ss = this.getCell(p, q);
        if (ss?.state === s.state) c.push(ss);
      }
    }
    return c;
  }

  // Moore neighborhood
  neighborhoodCountWhen(x: number, y: number, s: T): number {
    let c = 0;
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        c += +(this.getCell(p, q)?.state === s.state);
      }
    }
    return c;
  }

  // Von Neumann neighborhood
  regionCountWhen(x: number, y: number, R: number, s: T): number {
    let c = 0;
    for (let p = x - R; p <= x + R; p++) {
      for (let q = y - R; q <= y + R; q++) {
        const r = Math.abs(p - x) + Math.abs(q - y); // Manhattan distance
        if (r <= R) {
          c += +(this.getCell(p, q)?.state === s.state);
        }
      }
    }
    return c;
  }

  worldCountWhen(s: T): number {
    let c = 0;
    for (let x = 0; x < this.sizeX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        c += +(this.getCell(x, y)?.state === s.state);
      }
    }
    return c;
  }

  getCell(x: number, y: number): T {
    if (this.continuous) {
      x = (x + this.sizeX) % this.sizeX;
      y = (y + this.sizeY) % this.sizeY;
    } else {
      if (x < 0 || y < 0) return null;
      if (y >= this.currentGrid.length || x >= this.currentGrid[y]?.length) return null;
    }
    return this.currentGrid[y][x] as T;
  }

  immediatelySetCell(x: number, y: number, s: T) {
    if (this.continuous) {
      x = (x + this.sizeX) % this.sizeX;
      y = (y + this.sizeY) % this.sizeY;
    } else {
      if (x < 0 || y < 0) return null;
      if (y >= this.currentGrid.length || x >= this.currentGrid[y]?.length) return null;
    }
    this.currentGrid[y][x] = s;
    this.refreshStats();
  }

  doStep() {
    const changes = [];

    for (let x = 0; x < this.sizeX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        const c = this.getCell(x, y);
        const n = this.getNextCell(x, y);
        if (n !== c) {
          changes.push([x, y, n]);
        }
      }
    }

    // Only update what has changed
    for (const [x, y, n] of changes) {
      this.currentGrid[y][x] = n;
    }

    this.stats.Step++;

    this.refreshStats();
  }

  getRLE() {
    let rle = "";

    let l = "";
    let c = 0;

    for (let x = 0; x < this.sizeX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        const t = this.getCell(x, y)?.token;
        if (t !== l) {
          if (l !== "") rle += c + l;
          l = t;
          c = 1;
        } else {
          c++;
        }
      }
      rle += c + l + "$";
      c = 0;
      l = "";
    }
    return rle;

    /* 
      Tidy:
        Removes trailing b's from rows
        bounding box
    */
  }

  getGridClone() {
    return this.currentGrid.map((row) => row.slice());
  }

  setGrid(g: T[][]) {
    for (let x = 0; x < this.sizeX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        this.currentGrid[y][x] = g[y][x];
      }
    }
    this.refreshStats();
  }

  protected getNextField() {
    for (let y = 0; y < this.sizeX; y++) {
      for (let x = 0; x < this.sizeY; x++) {
        return this.getNextCell(x, y);
      }
    }
  }

  protected getNextCell(y: number, x: number) {
    return this.getCell(x, y);
  }
}

export function createState<T extends CellState = CellState>(
  state: string,
  token = state
): Readonly<T> {
  return {
    state,
    token,
  } as T;
}

export function makeGridWith<T extends CellState = CellState>(sizeX: number, sizeY: number, c: T | ((x: number, y: number) => T)) {
  return Array.from({ length: sizeY }, (_, y) => {
    return Array.from({ length: sizeX }, (_, x) => {
      return typeof c === 'function' ? c(x, y) : c;
    });
  });
}

