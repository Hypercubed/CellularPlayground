import { ACTIVE, EMPTY, CA, CAOptions, BoundaryType } from '../classes/base';
import { CellState } from '../classes/states';

const DendriteDefaultOptions: CAOptions = {
  width: 64,
  height: 64,
  boundaryType: BoundaryType.Wall,
};

export const OSCILLATOR = `6b2ob$5b4o$5b4o$b2o3b2ob$7o$4o$b2o2b3ob$5b4o$5b4o$6b2ob`;

export class Dendrite extends CA {
  stats: Record<string, any> = {
    Alive: 0,
  };

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  protected options: CAOptions;

  constructor(options?: Partial<CAOptions>) {
    super({
      ...DendriteDefaultOptions,
      ...options,
    });

    this.stochastic = true;
  }

  getNextCell(_: CellState, x: number, y: number) {
    const s = this.getNeighbors(x, y);
    const i = Math.floor(Math.random() * s.length);
    return s[i];
  }
}
