import {
  ACTIVE,
  EMPTY,
  CA,
  CAOptions,
  BoundaryType,
  IterationType,
} from '../classes/base';
import { CellState } from '../classes/states';

interface BlockCAOptions extends CAOptions {
  ruleString: string;
}

const VoteDefaultOptions: Partial<BlockCAOptions> = {
  width: 40,
  height: 40,
  boundaryType: BoundaryType.Torus,
  iterationType: IterationType.BoundingBox,
  neighborhoodRange: 0,
  ruleString: 'MS,D15;1;2;3;4;5;6;7;8;9;10;11;12;13;14;0',
};

export class BlockCA extends CA {
  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  protected rule: number[];

  constructor(options?: Partial<BlockCAOptions>) {
    options = {
      ...VoteDefaultOptions,
      ...options,
    };

    super(options);

    this.rule = options.ruleString
      .replace(/ /g, '')
      .replace(/^MS,D/, '')
      .split(';')
      .map(Number);
  }

  doStep() {
    this.changedGrid.clear();

    // Can this use the BoundingBox iteration type?
    for (let x = 0; x < this.width; x += 2) {
      for (let y = 0; y < this.height; y += 2) {
        this.doNeighborhood(null, x, y);
      }
    }

    this.currentGrid.assign(this.changedGrid);
    this.step++;
  }

  // Move to base class?
  getMargolusNeighborhood(x: number, y: number) {
    const nw = this.get(x, y);
    const ne = this.get(x + 1, y);
    const sw = this.get(x, y + 1);
    const se = this.get(x + 1, y + 1);

    return [nw, ne, sw, se];
  }

  // Margolus neighborhood
  doNeighborhood(_: CellState, x: number, y: number) {
    const d = this.step % 2;

    x = x - (x % 2) + d;
    y = y - (y % 2) + d;

    let [nw, ne, sw, se]: number[] = this.getMargolusNeighborhood(x, y).map(
      (s) => (s === ACTIVE ? 1 : 0)
    );

    const sum = nw + ne * 2 + sw * 4 + se * 8;
    const newState = this.rule[sum];

    nw = newState & 1;
    ne = newState & 2;
    sw = newState & 4;
    se = newState & 8;

    this.setNext(x, y, nw ? ACTIVE : EMPTY);
    this.setNext(x + 1, y, ne ? ACTIVE : EMPTY);
    this.setNext(x, y + 1, sw ? ACTIVE : EMPTY);
    this.setNext(x + 1, y + 1, se ? ACTIVE : EMPTY);
  }

  refreshStats() {
    this.stats.Generation = this.step;
    this.stats.Alive = this.worldCountWhen(ACTIVE);
  }
}
