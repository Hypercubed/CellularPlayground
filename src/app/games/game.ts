import { RouteConfigLoadStart } from "@angular/router";
import { readRle } from "./utils/rle";

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
  Infinite = 'infinite',
}

export const EMPTY = createState('empty', 'b', '');
export const ACTIVE = createState('active', 'o', '');

const DefaultGameOptions = {
  width: 40,
  height: 40,
  boundaryType: BoundaryType.Infinite
};

type SparseGrid<T extends CellState = CellState> = Record<number, Record<number, T>>;

const MaxSize = 65_536;

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
  * Items are arranged into rows
  */
  pallet: T[][];

  /* Width and height of the view grid,
  * For bounded girds also the border size */
  width: number;
  height: number;
  stats: Record<string, any>;

  boundaryType: BoundaryType = BoundaryType.Infinite;
  oneDimensional: boolean = false;
  step = 0;

  get defaultCell() {
    return this.states[0];
  }
  
  get emptyCell() {
    return this.states[this.states.length - 1];
  }
  
  protected neighborhoodRange = 1;
  protected currentGrid: SparseGrid<T>;
  protected changedGrid: SparseGrid<T>;
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
    this.stats = {};
  }
  
  reset() {
    this.clearGrid();
    this.step = 0;
  }

  clearGrid() {
    this.currentGrid = {};
  }

  refreshStats() {
    this.stats.Generation = this.step;
    if (this.oneDimensional) {
      this.stats.Generation = this.step;
      this.stats.Alive = Object.keys(this.currentGrid[this.step] || {}).length;
    } else {
      this.stats.Alive = this.worldCountWhen(ACTIVE as T);
      if (this.boundaryType === BoundaryType.Infinite) {
        const boundingBox = this.getBoundingBox();
        this.stats.Size = `${boundingBox[1] - boundingBox[3] + 1}x${boundingBox[2] - boundingBox[0] + 1}`;
      }
      this.stats.Changes = this.countChanges();
    }
  }

  fillWith(c?: T | ((x: number, y: number) => T)) {
    c ||= this.emptyCell;
    
    this.clearGrid();
    if (c === this.emptyCell) return;

    const grid = makeGridWith(this.width, this.height, c);

    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        this.set(x, y, grid[y][x]);
      }
    }
  }

  /**
   * Gets an array of all non empty cells in the world
   */
  getWorld(): T[] {
    let world = [];
    this.forEach(cell => {
      world.push(cell);
    });
    return world;
  }

  /**
   * Gets an array of all cells in the world that match the given state 
   */
  getWorldWhen(s: T): T[] {
    let c = [];
    this.forEach(cell => {
      if (cell?.state === s.state) c.push(cell);
    });
    return c;
  }

  /*
    * Gets the number of cells in the world that match the given state
    */
  worldCountWhen(s: T): number {
    let c = 0;
    this.forEach(cell => {
      c += +(cell?.state === s.state);
    });
    return c;
  }

  /*
    * Gets an array of all cells in the Moore neighborhood of the given cell
  */
  getNeighborsWhen(x: number, y: number, s: T): T[] {
    let c = [];
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        if (p === x && q === y) continue;
        const ss = this.get(p, q);
        if (ss?.state === s.state) c.push(ss);
      }
    }
    return c;
  }

  /*
    * Gets the number of cells in the Moore neighborhood of the given cell that match the given state
    */
  neighborhoodCountWhen(x: number, y: number, s: T): number {
    return this.getNeighborsWhen(x, y, s).length;
  }

  /*
    * Gets an array of all cells in the von Neumann neighborhood of the given cell
    */
  regionCountWhen(x: number, y: number, R: number, s: T): number {
    let c = 0;
    for (let p = x - R; p <= x + R; p++) {
      for (let q = y - R; q <= y + R; q++) {
        const r = Math.abs(p - x) + Math.abs(q - y); // Manhattan distance
        if (r <= R) {
          c += +(this.get(p, q)?.state === s.state);
        }
      }
    }
    return c;
  }

  get(x: number, y: number): T {
    [x, y] = this.getPosition(x, y);
    return this.currentGrid?.[y]?.[x] || this.emptyCell;
  }

  set(x: number, y: number, s: T) {
    [x, y] = this.getPosition(x, y);

    const c = this.get(x, y);
    if (s === c) return;

    this.changedGrid ??= Object.create(null);
    this.changedGrid[y] ??= Object.create(null);
    this.changedGrid[y][x] = s;
    
    // Set the cell
    if (s === this.emptyCell) {
      if (this.currentGrid?.[y]?.[x]) {
        delete this.currentGrid[y][x];
        if (!Object.keys(this.currentGrid[y]).length) {
          delete this.currentGrid[y];
        }
      }
    } else {
      this.currentGrid ??= Object.create(null);
      this.currentGrid[y] ??= Object.create(null);
      this.currentGrid[y][x] = s;
    }
  }

  doStep() {
    const updates: SparseGrid<T> = {};

    // For each cell that changed on the previous tick
    for (let y in this.changedGrid) {
      for (let x in this.changedGrid[y]) {

        // for each neighbor in range
        for (let q =-this.neighborhoodRange; q <= this.neighborhoodRange; q++) {
          for (let p =-this.neighborhoodRange; p <= this.neighborhoodRange; p++) {
            const [xx, yy] = this.getPosition(+x + p, +y + q);

            if (this.oneDimensional && yy !== this.step + 1) continue;

            // Cell was already visited, skip
            if (updates?.[yy]?.[xx]) continue;

            const c = this.get(xx, yy);
            const n = this.getNextCell(xx, yy) || c;
    
            updates[yy] ??= Object.create(null);
            updates[yy][xx] = n;
          }
        }
      }
    }

    this.changedGrid = {};

    // Only update what has changed
    for (let y in updates) {
      for (let x in updates[y]) {
        this.set(+x, +y, updates[y][x]);
      }
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

    const boundingBox = this.boundaryType === BoundaryType.Infinite ?
      this.getBoundingBox() :
      [0, this.width - 1, this.height - 1, 0];

    for (let y = boundingBox[0]; y <= boundingBox[2]; y++) {
      for (let x = boundingBox[3]; x <= boundingBox[1]; x++) {
        const t = this.get(x, y)?.token;
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

    if (this.boundaryType === BoundaryType.Infinite) {
      rle = rle.replace(/\d+b\$/g, '$'); // Remove trailing blanks
      rle = rle.replace(/\$+$/, ''); // Remove trailing newlines
    }

    return rle.trim();
  }

  loadRLE(rle: string) {
    this.clearGrid();
    if (!rle) return;

    const { grid, height, width } = readRle(rle);

    // Center the pattern
    let dx = Math.floor((this.width - width) / 2);
    let dy = 0;

    if (!this.oneDimensional) {
      dy = Math.floor((this.height - height) / 2);
    }

    for (let j = 0; j < grid.length; j++) {
      for (let i = 0; i <= grid[j].length; i++) {
        if (grid?.[j]?.[i]) {
          const state = this.tokenToState(grid[j][i]);
          this.set(i + dx, j + dy, state);
        }
      }
    }
  }

  tokenToState(token: string) {
    if (token === 'b') return this.emptyCell;
    if (token === 'o') return this.defaultCell;

    return this.states.find((s) => s.token === token) || this.emptyCell;
  }

  updateViewGrid(viewGrid: T[][], yMin: number, xMax: number, yMax: number, xMin: number) {
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        viewGrid[y - yMin] ??= [];
        viewGrid[y - yMin][x - xMin] = this.get(x, y);
      }
    }
  }

  getBoundingBox(): [number, number, number, number] {
    const boundingBox: [number, number, number, number] = [null, null, null, null];

    for (let y in this.currentGrid) {
      for (let x in this.currentGrid[y]) {
        if (this.get(+x, +y) !== this.emptyCell) {
          boundingBox[0] = Math.min(boundingBox[0] ?? +y, +y);
          boundingBox[1] = Math.max(boundingBox[1] ?? +x, +x);
          boundingBox[2] = Math.max(boundingBox[2] ?? +y, +y);
          boundingBox[3] = Math.min(boundingBox[3] ?? +x, +x);
        }
      }
    }

    return boundingBox;
  }

  countChanges(): number {
    let count = 0;
    this.forEach(() => {
      count++;
    });
    return count;
  }

  forEach(fn: (cell: T) => void) {
    for (let y in this.changedGrid) {
      for (let x in this.changedGrid[y]) {
        fn(this.get(+x, +y));
      }
    }
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
