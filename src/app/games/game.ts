export interface CellState {
  state: string; // state name
  token: string; // token used for saving
  display?: string; // token for display
}

export interface GameOptions {
  width: number;
  height: number;
  boundaryType: BoundaryType;
  oneDimensional: boolean;
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

const MaxSize = 65536;

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

  oneDimensional: boolean = false;
  step = 0;

  protected range = 1;

  /* readonly */
  get grid(): Readonly<T[][]> {
    // if (this.oneDimensional) {
    //   return this.viewGrid.slice(0, this.step + 1);
    // }
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
    this.oneDimensional = this.options.oneDimensional;

    this.boundingBox = [0, this.width - 1, this.height - 1, 0];
  }

  refreshStats() {
    this.stats.Generation = this.step;
    this.stats.Alive = this.worldCountWhen(ACTIVE as T);
    this.stats.Size = String(this.boundingBox[1] - this.boundingBox[3] + 1) + 'x' + String(this.boundingBox[2] - this.boundingBox[0] + 1);
    this.stats.BoundingBox = this.boundingBox;
  }

  reset() {
    this.fillWith(EMPTY as T);
    this.step = 0;
    this.refreshStats();
  }

  fillWith(c?: T | ((x: number, y: number) => T)) {
    c ||= this.emptyCell;
    this.viewGrid = makeGridWith(this.width, this.height, c);
    this.currentGrid = {};
    this.boundingBox = [0, this.width - 1, this.height - 1, 0];

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
    [x, y] = this.getPosition(x, y);
    return this.currentGrid?.[y]?.[x] || this.emptyCell as T;
  }

  immediatelySetCell(x: number, y: number, s: T): void {
    this.set(x, y, s);
    this.refreshStats();
  }

  private set(x: number, y: number, s: T) {
    [x, y] = this.getPosition(x, y);

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

  doStep() {
    const changes = [];

    let minX = this.boundingBox[3] - this.range;
    let maxX = this.boundingBox[1] + this.range;
    let minY = this.boundingBox[0] - this.range;
    let maxY = this.boundingBox[2] + this.range;

    if (this.oneDimensional) {
      minY = this.step + 1;
      maxY = this.step + 1;
    }

    let nextMinX = Infinity;
    let nextMaxX = -Infinity;
    let nextMinY = Infinity;
    let nextMaxY = -Infinity;

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const [xx, yy] = this.getPosition(x, y);
        
        const c = this.getCell(xx, yy);
        const n = this.getNextCell(xx, yy) || c;
        if (n !== c) {
          changes.push([xx, yy, n]);
        }
        if (c !== this.emptyCell) {
          nextMinX = Math.min(nextMinX, xx);
          nextMinY = Math.min(nextMinY, yy);
          nextMaxX = Math.max(nextMaxX, xx);
          nextMaxY = Math.max(nextMaxY, yy);
        }
      }
    }

    this.boundingBox[0] = nextMinY;
    this.boundingBox[1] = nextMaxX;
    this.boundingBox[2] = nextMaxY;
    this.boundingBox[3] = nextMinX;

    // Only update what has changed
    for (const [x, y, n] of changes) {
      this.set(x, y, n);
    }

    this.step++;
  }

  private getPosition(x: number, y: number): [number, number] {
    // Enforce boundary conditions
    if (this.boundaryType === BoundaryType.Torus) {
      x = mod(x, this.width);
      y = mod(y, this.height);
    } else if (this.boundaryType === BoundaryType.Wall) {
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (y >= this.height) y = this.height - 1;
      if (x >= this.width) x = this.width - 1;
    }

    // Enforce maximum compute size
    if (x < -MaxSize) x = -MaxSize;
    if (y < -MaxSize) y = -MaxSize;
    if (y >= MaxSize) y = MaxSize;
    if (x >= MaxSize) x = MaxSize;

    return [x, y];
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

  protected getNextCell(y: number, x: number): T | void {
    return;
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

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}
