export class UnboundedGrid<T> {
  get grid(): Readonly<Record<number, Record<number, T>>> {
    return this._grid;
  }

  private _grid: Record<number, Record<number, T>> = Object.create(null);

  constructor(private readonly _defaultValue: T = null) {}

  has(x: number, y: number) {
    return this._grid?.[y]?.[x] !== undefined;
  }

  get(x: number, y: number): T | undefined {
    return this._grid?.[y]?.[x];
  }

  set(x: number, y: number, value: T) {
    if (value === this._defaultValue) {
      this.remove(x, y);
      return;
    }
    this._grid[y] ??= Object.create(null);
    this._grid[y][x] = value;
  }

  remove(x: number, y: number) {
    delete this._grid[y]?.[x];
    if (this._grid[y] && Object.keys(this._grid[y]).length === 0) {
      delete this._grid[y];
    }
  }

  clear() {
    this._grid = Object.create(null);
  }

  getBoundingBox(): [number, number, number, number] {
    const boundingBox: [number, number, number, number] = [
      Infinity,
      -Infinity,
      -Infinity,
      Infinity,
    ];

    this.forEach((_, x, y) => {
      boundingBox[0] = Math.min(boundingBox[0] ?? y, y);
      boundingBox[1] = Math.max(boundingBox[1] ?? x, x);
      boundingBox[2] = Math.max(boundingBox[2] ?? y, y);
      boundingBox[3] = Math.min(boundingBox[3] ?? x, x);
    });

    return boundingBox;
  }

  forEach(fn: (cell: T, x: number, y: number) => void) {
    for (let y in this._grid) {
      for (let x in this._grid[y]) {
        const c = this.get(+x, +y);
        if (c) {
          fn(c, +x, +y);
        }
      }
    }
  }

  toArray(): T[] {
    let arr: T[] = [];
    this.forEach((cell) => {
      arr.push(cell);
    });
    return arr;
  }

  filter(fn: (cell: T, x: number, y: number) => boolean): UnboundedGrid<T> {
    let g = new UnboundedGrid<T>();
    this.forEach((cell, x, y) => {
      if (fn(cell, x, y)) {
        g.set(x, y, cell);
      }
    });
    return g;
  }

  map(fn: (cell: T, x: number, y: number) => T): UnboundedGrid<T> {
    let g = new UnboundedGrid<T>();
    this.forEach((cell, x, y) => {
      g.set(x, y, fn(cell, x, y));
    });
    return g;
  }

  reduce<U>(
    fn: (acc: U, cell: T, x: number, y: number) => U,
    initialValue: U
  ): U {
    let acc = initialValue;
    this.forEach((cell, x, y) => {
      acc = fn(acc, cell, x, y);
    });
    return acc;
  }

  assign(g: UnboundedGrid<T>) {
    g.forEach((s, x, y) => {
      this.set(x, y, s);
    });
  }
}
