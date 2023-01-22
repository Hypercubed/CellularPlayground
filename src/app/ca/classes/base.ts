import { UnboundedGrid } from './grid';
import { readRle } from '../utils/rle';
import { CellState, createState } from './states';
import { makeGridWith } from '../utils/grid';
import { mod } from '../utils/math';

export enum BoundaryType {
  Wall = 'wall',
  Torus = 'torus',
  Infinite = 'infinite',
}

export enum IterationType {
  BoundingBox = 'boundingBox',
  LastChanged = 'changed',
  Active = 'active',
}

export interface CAOptions {
  width: number;
  height: number;
  neighborhoodRange: number;
  boundaryType: BoundaryType;
  iterationType: IterationType;
}

export const EMPTY = createState('empty', 'b', '');
export const ACTIVE = createState('active', 'o', '');

const DefaultCAOptions = {
  width: 40,
  height: 40,
  neighborhoodRange: 1,
  boundaryType: BoundaryType.Infinite,
  iterationType: IterationType.LastChanged,
};

const MaxSize = 200_000;

export abstract class CA<
  T extends CellState = CellState,
  O extends CAOptions = CAOptions
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

  /* Stats that are displayed in the UI */
  stats: Record<string, any> = {};
  step = 0;

  get defaultCell() {
    return this.states[0];
  }

  get emptyCell() {
    return this.states[this.states.length - 1];
  }

  get grid() {
    return this.currentGrid.grid;
  }

  /* Set by options */
  readonly boundaryType: BoundaryType = BoundaryType.Infinite;
  readonly iterationType: IterationType = IterationType.LastChanged;
  neighborhoodRange = 1;

  protected currentGrid: UnboundedGrid<T>;
  protected changedGrid: UnboundedGrid<T>;

  constructor(options?: Partial<O>) {
    options = {
      ...DefaultCAOptions,
      ...options,
    };

    this.width = options.width;
    this.height = options.height;
    this.boundaryType = options.boundaryType;
    this.iterationType = options.iterationType;
    this.neighborhoodRange = options.neighborhoodRange;
  }

  reset() {
    this.clearGrid();
    this.step = 0;
  }

  clearGrid() {
    this.currentGrid = new UnboundedGrid<T>(this.emptyCell);
    this.changedGrid = new UnboundedGrid<T>(null);
  }

  refreshStats() {
    this.stats.Generation = this.step;
    this.stats.Alive = this.worldCountWhen(ACTIVE as T);
    if (this.boundaryType === BoundaryType.Infinite) {
      const boundingBox = this.currentGrid.getBoundingBox();
      this.stats.Size = `${boundingBox[1] - boundingBox[3] + 1}x${
        boundingBox[2] - boundingBox[0] + 1
      }`;
    }
    this.stats.Births = this.changedGrid.reduce(
      (acc, cell) => acc + +(cell?.state !== this.emptyCell.state),
      0
    );
    this.stats.Deaths = this.changedGrid.reduce(
      (acc, cell) => acc + +(cell?.state === this.emptyCell.state),
      0
    );
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
    return this.currentGrid.toArray();
  }

  /**
   * Gets an array of all cells in the world that match the given state
   */
  getWorldWhen(s: T): T[] {
    return this.currentGrid.toArray().filter((cell) => cell?.state === s.state);
  }

  /*
   * Gets the number of cells in the world that match the given state
   */
  worldCountWhen(s: T | string): number {
    const state = typeof s === 'string' ? s : s.state;
    return this.currentGrid.reduce(
      (c, cell) => c + +(cell?.state === state),
      0
    );
  }

  /*
   * Gets an array of all cells in the Moore neighborhood of the given cell, including self
   */
  neighborhoodCountWhen(x: number, y: number, s: T): number {
    let c = 0;
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        const ss = this.get(p, q);
        if (ss?.state === s.state) c++;
      }
    }
    return c;
  }

    /*
   * Gets the count of non-empty cells in the Moore neighborhood, including self
   */
    nineSum(x: number, y: number): number {
      let c = 0;
      for (let p = x - 1; p <= x + 1; p++) {
        for (let q = y - 1; q <= y + 1; q++) {
          const ss = this.get(p, q);
          if (ss?.state !== this.emptyCell.state) c++;
        }
      }
      return c;
    }
  


  /*
   * Gets an array of all cells in the Moore neighborhood of the given cell, excluding self
   */
  getNeighbors(x: number, y: number): T[] {
    let c = [];
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        if (p === x && q === y) continue;
        const ss = this.get(p, q);
        c.push(ss);
      }
    }
    return c;
  }

  /*
   * Gets an array of all cells in the Moore neighborhood of the given cell, excluding self
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
  neighborsCountWhen(x: number, y: number, s: T): number {
    let c = 0;
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        if (p === x && q === y) continue;
        const ss = this.get(p, q);
        if (ss?.state === s.state) c++;
      }
    }
    return c;
  }

  /*
   * Counts the number of cells in the Moore neighborhood of the given cell that are not empty
   */
  eightSum(x: number, y: number): number {
    let c = 0;
    for (let p = x - 1; p <= x + 1; p++) {
      for (let q = y - 1; q <= y + 1; q++) {
        if (p === x && q === y) continue;
        const ss = this.get(p, q);
        if (ss?.state && ss.state !== this.emptyCell.state) c++;
      }
    }
    return c;
  }

  getVonNeumannNeighbors(x: number, y: number): T[] {
    const up = this.get(x, y - 1);
    const right = this.get(x + 1, y);
    const down = this.get(x, y + 1);
    const left = this.get(x - 1, y);

    return [up, right, down, left];
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
    return this._get(...this.getPosition(x, y));
  }

  protected _get(x: number, y: number): T {
    return this.currentGrid.get(x, y) || this.emptyCell;
  }

  set(x: number, y: number, s: T) {
    this._set(...this.getPosition(x, y), s);
  }

  protected _set(x: number, y: number, s: T) {
    const c = this.get(x, y);
    if (s === c) return;

    this.changedGrid.set(x, y, s);

    // Set the cell
    if (s === this.emptyCell) {
      this.currentGrid.remove(x, y);
    } else {
      this.currentGrid.set(x, y, s);
    }
  }

  protected setNext(x: number, y: number, s: T) {
    this._setNext(...this.getPosition(x, y), s);
  }

  protected _setNext(x: number, y: number, s: T) {
    const c = this._get(x, y);
    if (s === c) return;

    this.changedGrid.set(x, y, s);
  }

  protected stepFunction(_: T, x: number, y: number, R: number) {
    // for each neighbor in range
    for (let q = -R; q <= R; q++) {
      for (let p = -R; p <= R; p++) {
        const [xx, yy] = this.getPosition(x + p, y + q);

        // Cell was already visited, skip
        if (this.changedGrid.has(xx, yy)) continue;

        const c = this._get(xx, yy);
        const n = this.stateFunction(c, xx, yy) || c;
        this._setNext(xx, yy, n);
      }
    }
  }

  doStep(): void {
    switch (this.iterationType) {
      case IterationType.BoundingBox:
        this.doStep = this.doStep_boundingBox;
        break;
      case IterationType.Active:
        this.doStep = this.doStep_active;
        break;
      case IterationType.LastChanged:
      default:
        this.doStep = this.doStep_lastChanged;
    }

    return this.doStep();
  }

  private doStep_lastChanged() {
    const lastChanges = this.changedGrid;
    this.changedGrid = new UnboundedGrid<T>();

    // For each cell that changed on the previous tick (and neighbors)
    lastChanges.forEach((c: T, x: number, y: number) =>
      this.stepFunction(c, x, y, this.neighborhoodRange)
    );

    this.currentGrid.assign(this.changedGrid);
    this.step++;
  }

  private doStep_active() {
    this.changedGrid.clear();

    // For each cell do also do all non-empty cells (and neighbors)
    this.currentGrid.forEach((c: T, x: number, y: number) =>
      this.stepFunction(c, x, y, this.neighborhoodRange)
    );

    this.currentGrid.assign(this.changedGrid);
    this.step++;
  }

  private doStep_boundingBox() {
    this.changedGrid.clear();

    // For each cell do also do all non-empty cells (and neighbors)
    if (this.iterationType === IterationType.BoundingBox) {
      const bb = this.getBoundingBox();
      for (let x = bb[0]; x < bb[2]; x++) {
        for (let y = bb[1]; y < bb[3]; y++) {
          const c = this.get(x, y);
          this.stepFunction(c, x, y, this.neighborhoodRange);
        }
      }
    }

    this.currentGrid.assign(this.changedGrid);
    this.step++;
  }

  getBoundingBox(): [number, number, number, number] {
    switch (this.boundaryType) {
      case BoundaryType.Wall:
      case BoundaryType.Torus:
        this.getBoundingBox = this.getBoundingBox_finite;
        break;
      case BoundaryType.Infinite:
      default:
        this.getBoundingBox = this.getBoundingBox_infinite;
    }

    return this.getBoundingBox();
  }

  private getBoundingBox_finite(): [number, number, number, number] {
    return [0, 0, this.width, this.height];
  }

  private getBoundingBox_infinite(): [number, number, number, number] {
    return this.currentGrid.getBoundingBox();
  }

  protected getPosition(x: number, y: number): [number, number] {
    switch (this.boundaryType) {
      case BoundaryType.Torus:
        this.getPosition = this.getPosition_torus;
        break;
      case BoundaryType.Wall:
        this.getPosition = this.getPosition_wall;
        break;
      case BoundaryType.Infinite:
      default:
        this.getPosition = this.getPosition_infinite;
    }

    return this.getPosition(x, y);
  }

  private getPosition_infinite(x: number, y: number): [number, number] {
    // Enforce maximum compute size
    if (x < -MaxSize) x = -MaxSize;
    if (y < -MaxSize) y = -MaxSize;
    if (y >= MaxSize) y = MaxSize;
    if (x >= MaxSize) x = MaxSize;

    return [x, y];
  }

  private getPosition_wall(x: number, y: number): [number, number] {
    // Enforce boundary conditions
    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (y >= this.height) y = this.height - 1;
    if (x >= this.width) x = this.width - 1;

    return [x, y];
  }

  private getPosition_torus(x: number, y: number): [number, number] {
    // Enforce boundary conditions
    x = mod(x, this.width);
    y = mod(y, this.height);

    return [x, y];
  }

  getRLE() {
    let rle = '';

    let l = '';
    let c = 0;

    const [yMin, xMax, yMax, xMin] =
      this.boundaryType !== BoundaryType.Wall
        ? this.currentGrid.getBoundingBox()
        : [0, this.width - 1, this.height - 1, 0];

    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
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

    let dx = 0;
    let dy = 0;

    if (this.boundaryType !== BoundaryType.Wall) {
      // Center the pattern
      dx = Math.floor((this.width - width) / 2);
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

  findState(state: string) {
    return this.states.find((s) => s.state === state);
  }

  tokenToState(token: string) {
    if (token === 'b') return this.emptyCell;
    if (token === 'o') return this.defaultCell;

    return this.states.find((s) => s.token === token) || this.emptyCell;
  }

  updateViewGrid(
    viewGrid: T[][],
    yMin: number,
    xMax: number,
    yMax: number,
    xMin: number
  ) {
    for (let y = yMin; y <= yMax; y++) {
      for (let x = xMin; x <= xMax; x++) {
        viewGrid[y - yMin] ??= [];
        viewGrid[y - yMin][x - xMin] = this.get(x, y);
      }
    }
  }

  protected stateFunction(c: T, y: number, x: number): T | void {
    return;
  }
}
