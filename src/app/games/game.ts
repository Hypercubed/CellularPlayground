export interface CellState {
  state: string; // state name
  token: string; // token used for saving
  display?: string; // token for display
}

export interface GameOptions {
  width: number;
  height: number;
  boundaryType: BoundaryType;
}

export enum BoundaryType {
  Wall = 'wall',
  Torus = 'torus',
  Infinite = 'infinite'
}

export const EMPTY = createState('empty', 'b', '');
export const ACTIVE = createState('active', 'o', '');

const DefaultGameOptions = {
  width: 40,
  height: 40,
  boundaryType: BoundaryType.Infinite,
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

  /* Array of states that are shown in the pallet
    Items are arranged into rows */
  pallet: T[][];

  width: number;
  height: number;
  stats: Record<string, any>;

  /* If true, the grid is a torus */
  // TODO: add UI for this
  continuous: boolean = false;

  boundaryType: BoundaryType = BoundaryType.Infinite;

  protected range = 1;

  /* readonly */
  get grid(): Readonly<T[][]> {
    return this.viewGrid;
  }

  get defaultCell() {
    return this.states[0];
  }

  get emptyCell() {
    return this.states[this.states.length - 1];
  }

  // TODO: replace this with a sparse matrix
  // Update view grid when this changes
  protected currentGrid: Record<number, Record<number, T>>;
  protected viewGrid: T[][];

  protected boundingBox: [number, number, number, number];

  protected options: O;

  constructor(options?: Partial<O>) {
    this.options = {
      ...DefaultGameOptions,
      ...options,
    } as O;

    this.width = this.options.width;
    this.height = this.options.height;
    this.boundaryType = this.options.boundaryType;

    this.boundingBox = [0, this.width, this.height, 0];
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
    this.viewGrid = makeGridWith(this.width, this.height, c);
    this.currentGrid = {};

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.set(x, y, this.viewGrid[y][x]);
      }
    }

    this.refreshStats();
  }

  getWorld(): T[] {
    let c = [];
    for (let x = this.boundingBox[3]; x <= this.boundingBox[1]; x++) {
      for (let y = this.boundingBox[0]; y <= this.boundingBox[2]; y++) {
        c.push(this.getCell(x, y));
      }
    }
    return c;
  }

  getWorldWhen(s: T): T[] {
    let c = [];
    for (let x = this.boundingBox[3]; x <= this.boundingBox[1]; x++) {
      for (let y = this.boundingBox[0]; y <= this.boundingBox[2]; y++) {
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
    for (let x = this.boundingBox[3]; x <= this.boundingBox[1]; x++) {
      for (let y = this.boundingBox[0]; y <= this.boundingBox[2]; y++) {
        c += +(this.getCell(x, y)?.state === s.state);
      }
    }
    return c;
  }

  getCell(x: number, y: number): T {
    if (this.boundaryType === BoundaryType.Torus) {
      x = (x + this.width) % this.width;
      y = (y + this.height) % this.height;
    } else if (this.boundaryType === BoundaryType.Wall) {
      if (x < 0 || y < 0) return this.emptyCell;
      if (y >= this.height || x >= this.width)
        return this.emptyCell;
    }
    return this.get(x, y) as T;
  }

  immediatelySetCell(x: number, y: number, s: T): void {
    this.set(x, y, s);
    this.refreshStats();
  }

  private get(x: number, y: number): T {
    return this.currentGrid?.[y]?.[x] || this.emptyCell;
  }

  private set(x: number, y: number, s: T) {
    // Enforce boundary conditions
    if (this.boundaryType === BoundaryType.Torus) {
      x = (x + this.width) % this.width;
      y = (y + this.height) % this.height;
    } else if (this.boundaryType === BoundaryType.Wall) {
      if (x < 0 || y < 0) return;
      if (y >= this.height || x >= this.width)
        return;
    }

    if (!this.currentGrid[y]) {
      this.currentGrid[y] = {};
    }

    // Set the cell
    if (s === this.emptyCell) {
      delete this.currentGrid[y][x];
    } else {
      this.currentGrid[y][x] = s;
      this.boundingBox[0] = Math.min(this.boundingBox[0], y);
      this.boundingBox[1] = Math.max(this.boundingBox[1], x);
      this.boundingBox[2] = Math.max(this.boundingBox[2], y);
      this.boundingBox[3] = Math.min(this.boundingBox[3], x);
    }

    // Update the view
    if (x < 0 || y < 0) return;
    if (y >= this.height || x >= this.width) return;
    this.viewGrid[y][x] = s;
  }

  doSteps(n: number = 1) {
    for (let i = 0; i < n; i++) {
      this.doStep();
    }
    this.refreshStats();
  }

  protected doStep() {
    const changes = [];

    const minX = this.boundingBox[3] - this.range;
    const maxX = this.boundingBox[1] + this.range;
    const minY = this.boundingBox[0] - this.range;
    const maxY = this.boundingBox[2] + this.range;

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const c = this.getCell(x, y);
        const n = this.getNextCell(x, y) || c;
        if (n !== c) {
          changes.push([x, y, n]);
        }
      }
    }

    // Only update what has changed
    for (const [x, y, n] of changes) {
      this.set(x, y, n);
    }

    this.stats.Step++;
  }

  getRLE() {
    let rle = '';

    let l = '';
    let c = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const t = this.getCell(x, y)?.token;
        if (t !== l) {
          if (l !== '') {
            rle += c > 1 ? c + l : l;
          }
          l = t;
          c = 1;
        } else {
          c++;
        }
      }
      rle += (c > 1 ? c + l : l) + '$';
      c = 0;
      l = '';
    }

    // normalize
    const b = this.emptyCell.token;
    rle = rle.replace(new RegExp(`${b}`, 'g'), 'b');

    const o = this.defaultCell.token;
    rle = rle.replace(new RegExp(`${o}`, 'g'), 'o');

    rle = rle.replace(/\d+b\$/g, '$'); // Remove trailing blanks
    rle = rle.replace(/\$+$/, ''); // Remove trailing newlines

    return rle; // Remove trailing blanks
  }

  rleToGrid(rle: string) {
    // TODO: sparse grids
    const g = makeGridWith<any>(this.width, this.height, this.emptyCell);

    let x = 0;
    let y = 0;

    const r = rle.split('$');

    for (const c of r) {
      const m = c.matchAll(/(\d*)(\D)/g);
      for (let [_, count, token] of m) {
        const s = this.tokenToState(token);
        for (let i = 0; i < +(count || 1); i++) {
          g[y][x++] = s;
        }
      }

      x = 0;
      y++;
    }
    return g;
  }

  tokenToState(token: string) {
    if (token === 'b') return this.emptyCell;
    if (token === 'o') return this.defaultCell;

    return this.states.find((s) => s.token === token) || this.emptyCell;
  }

  getGridClone() {
    return this.viewGrid.map((row) => row.slice());
  }

  setGrid(g: T[][]) {
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.set(x, y, g?.[y]?.[x] || this.emptyCell);
      }
    }
    this.refreshStats();
  }

  protected getNextField() {
    for (let x = this.boundingBox[3]; x < this.boundingBox[1]; x++) {
      for (let y = this.boundingBox[0]; y < this.boundingBox[2]; y++) {
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
  token = state,
  display = token
): Readonly<T> {
  return Object.freeze({
    state,
    token: token[0], // ensure token is one character
    display,
  }) as T;
}

export function makeGridWith<T extends CellState = CellState>(
  width: number,
  height: number,
  c: T | ((x: number, y: number) => T)
) {
  return Array.from({ length: height }, (_, y) => {
    return Array.from({ length: width }, (_, x) => {
      return typeof c === 'function' ? c(x, y) : c;
    });
  });
}
