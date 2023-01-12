import { ACTIVE, BoundaryType, EMPTY, CAOptions } from '../classes/base';
import { OCA } from '../classes/elementary';

import type { CellState } from '../classes/states';

const defaultECAOptions = {
  oneDimensional: true,
  width: 43,
  height: 22,
  boundaryType: BoundaryType.Infinite,
  ruleNumber: 30,
};

interface ECAOptions extends CAOptions {
  ruleNumber: number;
}

export class ECA extends OCA<CellState, ECAOptions> {
  width = 86 / 2;
  height = 86 / 2;

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  private ruleNumber: number;

  constructor(options?: Partial<ECAOptions>) {
    super({
      ...defaultECAOptions,
      ...options,
    });

    this.ruleNumber = this.options.ruleNumber;
  }

  refreshStats() {
    this.stats.n = this.step;
    this.stats['a(n)'] = this.getValue(this.step);
  }

  getNextCell(_: CellState, x: number, y: number) {
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
