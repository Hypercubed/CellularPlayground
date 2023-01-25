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
  static readonly title = 'Block CA';
  static readonly description =
    'A block cellular automaton or partitioning cellular automaton is a special kind of cellular automaton in which the lattice of cells is divided into non-overlapping blocks (with different partitions at different time steps) and the transition rule is applied to a whole block at a time rather than a single cell';
  static readonly options: Partial<BlockCAOptions>[] = [
    {
      title: 'Tron',
      ruleString: 'MS,D15;1;2;3;4;5;6;7;8; 9;10;11;12;13;14;0',
    },
    {
      title: 'Billiard Ball Machine',
      ruleString: 'MS,D0;8;4;3;2;5;9;7; 1;6;10;11;12;13;14;15',
    },
    {
      title: 'Bounce Gas',
      ruleString: 'MS,D0;8;4;3;2;5;9;14; 1;6;10;13;12;11;7;15',
    },
    {
      title: 'HPP Gas',
      ruleString: 'MS,D0;8;4;12;2;10;9; 14;1;6;5;13;3;11;7;15',
    },
    {
      title: 'Critters',
      ruleString: 'MS,D15;14;13;3;11;5; 6;1;7;9;10;2;12;4;8;0',
    },
    {
      title: 'Sand',
      ruleString: 'MS,D0;4;8;12;4;12;12;13; 8;12;12;14;12;13;14;15',
      boundaryType: BoundaryType.Wall,
    },
    {
      title: 'Rotations',
      ruleString: 'MS,D0;2;8;12;1;10;9; 11;4;6;5;14;3;7;13;15',
    },
  ];
  static readonly className = 'block';

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
        this.stepFunction(null, x, y);
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
  stepFunction(_: CellState, x: number, y: number) {
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
