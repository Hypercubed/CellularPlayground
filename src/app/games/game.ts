export interface CellState {
  state: string;
  token: string;
}

export interface GameOptions {
  width: number;
  height: number;
  continuous: boolean;
}

export const EMPTY = createState("empty", "b");
export const ACTIVE = createState("alive", "o");

const DefaultGameOptions = {
  width: 40,
  height: 40,
  continuous: false,
};

export abstract class Game<
  T extends CellState = CellState,
  O extends GameOptions = GameOptions
> {
  /* Array of all possible states
   * The first state is the default state
   * The last state is the state that is used when the cell is empty
   */
  states: T[];

  /* Array of states that are shown in the pallet */
  pallet: T[][];

  width: number;
  height: number;
  stats: Record<string, any>;

  /* If true, the grid is a torus */
  continuous: boolean = false;

  /* readonly */
  get grid(): Readonly<T[][]> {
    return this.currentGrid;
  }

  get defaultCell() {
    return this.states[0];
  }

  get emptyCell() {
    return this.states[this.states.length - 1];
  }

  protected currentGrid: T[][];
  protected options: O;

  constructor(options?: Partial<O>) {
    this.options = {
      ...DefaultGameOptions,
      ...options,
    } as O;

    this.width = this.options.width;
    this.height = this.options.height;
    this.continuous = this.options.continuous;
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ACTIVE as T);
  }

  reset() {
    this.fillWith(EMPTY as T);
    this.stats.Step = 0;
    this.refreshStats();
  }

  fillWith(c?: T | ((x: number, y: number) => T)) {
    c ||= this.emptyCell;
    this.currentGrid = makeGridWith(this.width, this.height, c);
    this.refreshStats();
  }

  getWorld(): T[] {
    let c = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        c.push(this.getCell(x, y));
      }
    }
    return c;
  }

  getWorldWhen(s: T): T[] {
    let c = [];
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
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
    return this.getNeighborsWhen(x, y, s).length;
  }

  // von Neumann neighborhood
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
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        c += +(this.getCell(x, y)?.state === s.state);
      }
    }
    return c;
  }

  getCell(x: number, y: number): T {
    if (this.continuous) {
      x = (x + this.width) % this.width;
      y = (y + this.height) % this.height;
    } else {
      if (x < 0 || y < 0) return this.emptyCell;
      if (y >= this.currentGrid.length || x >= this.currentGrid[y]?.length)
        return this.emptyCell;
    }
    return this.currentGrid[y][x] as T;
  }

  immediatelySetCell(x: number, y: number, s: T) {
    if (this.continuous) {
      x = (x + this.width) % this.width;
      y = (y + this.height) % this.height;
    } else {
      if (x < 0 || y < 0) return this.emptyCell;
      if (y >= this.currentGrid.length || x >= this.currentGrid[y]?.length)
        return this.emptyCell;
    }
    this.currentGrid[y][x] = s;
    this.refreshStats();
  }

  doSteps(n: number = 1, fps = false) {
    for (let i = 0; i < n; i++) {
      this.doStep();
    }
    this.refreshStats();
  }

  protected doStep() {
    const changes = [];

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
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
  }

  getRLE() {
    let rle = "";

    let l = "";
    let c = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
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

    // normalize
    const b = this.emptyCell.token;
    rle = rle.replace(new RegExp(`${b}`, "g"), "b");

    const o = this.defaultCell.token;
    rle = rle.replace(new RegExp(`${o}`, "g"), "o");

    rle = rle.replace(/\d+b\$/g, "$"); // Remove trailing blanks
    rle = rle.replace(/\$+$/, ""); // Remove trailing newlines

    return rle; // Remove trailing blanks
  }

  rleToGrid(rle: string) {
    const g = makeGridWith(this.width, this.height, this.emptyCell);

    let x = 0;
    let y = 0;

    const r = rle.split("$");

    for (const c of r) {
      const m = c.matchAll(/(\d+)(\D+)/g);
      for (const [_, count, token] of m) {
        const s = this.tokenToState(token);
        for (let i = 0; i < +count; i++) {
          g[y][x++] = s;
        }
      }

      x = 0;
      y++;
    }
    return g;
  }

  tokenToState(token: string) {
    return this.states.find((s) => s.token === token) || this.emptyCell;
  }

  getGridClone() {
    return this.currentGrid.map((row) => row.slice());
  }

  setGrid(g: T[][]) {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.currentGrid[y][x] = g?.[y]?.[x] || this.emptyCell;
      }
    }
    this.refreshStats();
  }

  protected getNextField() {
    for (let y = 0; y < this.width; y++) {
      for (let x = 0; x < this.height; x++) {
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

export function makeGridWith<T extends CellState = CellState>(
  width: number,
  height: number,
  c: T | ((x: number, y: number) => T)
) {
  return Array.from({ length: height }, (_, y) => {
    return Array.from({ length: width }, (_, x) => {
      return typeof c === "function" ? c(x, y) : c;
    });
  });
}
