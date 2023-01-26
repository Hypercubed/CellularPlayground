import {
  ACTIVE,
  EMPTY,
  CA,
  CAOptions,
  BoundaryType,
  IterationType,
} from '../classes/base';
import { CellState } from '../classes/states';

const DendriteDefaultOptions: Partial<CAOptions> = {
  width: 64,
  height: 64,
  boundaryType: BoundaryType.Wall,
  iterationType: IterationType.BoundingBox,
};

export const OSCILLATOR = `6b2ob$5b4o$5b4o$b2o3b2ob$7o$4o$b2o2b3ob$5b4o$5b4o$6b2ob`;

export class Dendrite extends CA {
  static readonly title = 'Dendrite';
  static readonly description = 'Naive Diffusion with dendrite accretion.';
  static readonly className = 'dendrite';

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  protected options: CAOptions;

  constructor(options?: Partial<CAOptions>) {
    super({
      ...DendriteDefaultOptions,
      ...options,
    });
  }

  stateFunction(_: CellState, x: number, y: number) {
    const s = this.getNeighbors(x, y);
    const i = Math.floor(Math.random() * s.length);
    return s[i];
  }
}
