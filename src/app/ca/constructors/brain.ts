import { ACTIVE, EMPTY, CA, CAOptions, BoundaryType } from '../classes/base';
import { CellState, createState } from '../classes/states';

const READY = EMPTY;
const FIRING = ACTIVE;
const REFRACTORY = createState('refractory', 'r', '');

const BrainDefaultOptions: Partial<CAOptions> = {
  width: 64,
  height: 64,
  boundaryType: BoundaryType.Infinite,
};

export const BRIAN_OSCILLATOR = 'br$b2or$r2ob$2brb';

export class Brain extends CA {
  states = [FIRING, REFRACTORY, READY];
  pallet = [[FIRING, REFRACTORY, READY]];

  constructor(options?: Partial<CAOptions>) {
    super({
      ...BrainDefaultOptions,
      ...options,
    });
  }

  stateFunction(c: CellState, x: number, y: number) {
    switch (c) {
      case REFRACTORY:
        return READY;
      case FIRING:
        return REFRACTORY;
      case READY: {
        const count = this.neighborsCountWhen(x, y, FIRING);
        return count === 2 ? FIRING : READY;
      }
    }
    return c;
  }

  refreshStats() {
    this.stats.Generation = this.step;
    this.stats.Firing = this.worldCountWhen(FIRING);
    this.stats.Refractory = this.worldCountWhen(REFRACTORY);

    if (this.boundaryType === BoundaryType.Infinite) {
      const boundingBox = this.currentGrid.getBoundingBox();
      this.stats.Size = `${boundingBox[1] - boundingBox[3] + 1}x${
        boundingBox[2] - boundingBox[0] + 1
      }`;
    }
  }
}
