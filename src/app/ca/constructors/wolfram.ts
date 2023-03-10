import { ACTIVE, BoundaryType, EMPTY, CAOptions } from '../classes/base';
import { OCA } from '../classes/elementary';

import type { CellState } from '../classes/states';

interface ECAOptions extends CAOptions {
  ruleNumber: number;
}

const defaultECAOptions: Partial<ECAOptions> = {
  width: 43,
  boundaryType: BoundaryType.Infinite,
  ruleNumber: 30,
};

export class ECA extends OCA<CellState, ECAOptions> {
  static readonly title = 'Wolfram';
  static readonly description =
    'The simplest class of one-dimensional cellular automata.';
  static readonly options: Partial<ECAOptions>[] = [
    { title: 'Rule 30', ruleNumber: 30 },
    { title: 'Rule 90', ruleNumber: 90 },
    // { title: 'Rule 73', ruleNumber: 73 },
    // { title: 'Rule 74', ruleNumber: 74 },
    { title: 'Rule 110', ruleNumber: 110 },
  ];
  static readonly patterns = [];
  static readonly startingPattern = 'o';
  static readonly className = 'wolfram';

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  private ruleNumber: number;

  constructor(options?: Partial<ECAOptions>) {
    options = {
      ...defaultECAOptions,
      ...options,
    };

    super(options);

    this.ruleNumber = options.ruleNumber;
  }

  refreshStats() {
    this.stats.n = this.step;
    this.stats['a(n)'] = this.getValue(this.step);
  }

  stepFunction(_: CellState, x: number, y: number, R: number) {
    if (y !== this.step) return;

    // for each neighbor in range
    for (let p = -R; p <= R; p++) {
      const [xx, yy] = this.getPosition(x + p, this.step + 1);

      // Cell was already visited, skip
      if (this.changedGrid.has(xx, yy)) continue;

      const c = this._get(xx, yy);
      const n = this.stateFunction(c, xx, yy) || c;
      this._setNext(xx, yy, n);
    }
  }

  stateFunction(_: CellState, x: number, y: number) {
    const b0 = +(this.get(x + 1, y - 1)?.state === ACTIVE.state);
    const b1 = +(this.get(x, y - 1)?.state === ACTIVE.state);
    const b2 = +(this.get(x - 1, y - 1)?.state === ACTIVE.state);
    return this.ruleNumber & (2 ** (b2 * 4 + b1 * 2 + b0)) ? ACTIVE : EMPTY;
  }

  private getValue(y: number): number {
    const mid = Math.floor(this.width / 2);
    const bits = this.currentGrid.reduce((acc, cell, xx, yy) => {
      if (yy !== y) return acc;
      acc.push([xx, +(cell?.state === ACTIVE.state)]);
      return acc;
    }, []);

    const length = 2 * this.step + 1;
    let bin = Array.from({ length }).fill(0);

    bits.forEach(([x, v]) => {
      bin[x - mid + this.step] = v;
    });

    return parseInt(bin.join(''), 2);
  }
}
