import {
  EMPTY,
  CA,
  CAOptions,
  BoundaryType,
  IterationType,
} from '../classes/base';
import { CellState, createState } from '../classes/states';

const RainDefaultOptions: Partial<CAOptions> = {
  width: 60,
  height: 60,
  boundaryType: BoundaryType.Wall,
  iterationType: IterationType.Active,
  neighborhoodRange: 0,
};

const WALL = createState('wall', 'W', '');
const ICE = createState('ice', 'I', '');
const ROCK = createState('rock', 'R', '');

const SAND = createState('sand', 'S', '');
const WATER = createState('water', 'A', '');
const VAPOR = createState('vapor', 'V', '');

const density = [EMPTY, VAPOR, ICE, WATER, SAND, ROCK, WALL];

function getDensity(s: CellState) {
  return density.indexOf(s);
}

export class Rain extends CA {
  states = [WALL, ROCK, SAND, WATER, ICE, VAPOR, EMPTY];
  pallet = [
    [ROCK, SAND],
    [ICE, WATER, VAPOR],
    [WALL, EMPTY],
  ];

  constructor(options?: Partial<CAOptions>) {
    super({
      ...RainDefaultOptions,
      ...options,
    });
  }

  raises(c: CellState, x: number, y: number) {
    if (y > 0) {
      const yy = y - 1;
      const up = this.get(x, yy);

      if (up !== WALL && !this.changedGrid.has(x, yy)) {
        this.setNext(x, yy, c);
        this.setNext(x, y, up);
        return true;
      }
    }
  }

  condenses(c: CellState, x: number, y: number) {
    const T = y;

    // Condenses
    if (T < this.height / 6) {
      if (Math.random() < 0.1) {
        this.setNext(x, y, ICE);
        return true;
      }
    } else if (T < this.height / 3) {
      if (Math.random() < 0.1) {
        this.setNext(x, y, WATER);
        return true;
      }
    }
  }

  falls(c: CellState, x: number, y: number) {
    if (y < this.height - 1) {
      const den = getDensity(c);

      const yy = y + 1;
      if (this.changedGrid.has(x, yy)) return;

      const down = this.get(x, yy);

      // Everything falls down
      if (den > getDensity(down)) {
        this.setNext(x, yy, c);
        this.setNext(x, y, down);
        return true;
      }
    }
  }

  flows(c: CellState, x: number, y: number) {
    if (y < this.height - 1) {
      const den = getDensity(c);

      const yy = y + 1;
      if (yy >= this.height) return;

      let xx = x;

      // Margolus neighborhood-like
      if ((this.step + x + y) % 2 === 0) {
        xx = x - 1;
      } else {
        xx = x + 1;
      }
      if (xx < 0 || xx >= this.width) return;

      const down = this.get(xx, yy);
      const canMove = getDensity(down) < den && !this.changedGrid.has(xx, yy);
      if (canMove) {
        this.setNext(xx, yy, c);
        this.setNext(x, y, down);
        return true;
      }
    }
  }

  sloshes(c: CellState, x: number, y: number) {
    const den = getDensity(c);

    let xx = x;
    // Margolus neighborhood-like
    if ((this.step + x + y) % 2 === 0) {
      xx = x - 1;
    } else {
      xx = x + 1;
    }

    if (xx < 0 || xx >= this.width) return;

    const side = this.get(xx, y);
    const canMove = getDensity(side) < den && !this.changedGrid.has(xx, y);

    if (canMove) {
      this.setNext(xx, y, c);
      this.setNext(x, y, side);
      return true;
    }
  }

  melts(_: CellState, x: number, y: number) {
    const T = y;
    if (Math.random() < (0.2 * T) / this.height) {
      this.setNext(x, y, WATER);
      return true;
    }
  }

  evaporates(_: CellState, x: number, y: number) {
    const up = this.get(x, y - 1);
    if (up === EMPTY) {
      const T = y;
      if (Math.random() < ((0.3 / 2) * T) / this.height) {
        this.setNext(x, y, VAPOR);
        return true;
      }
    }
  }

  freezes(_: CellState, x: number, y: number) {
    const T = y;
    if (T < this.height / 3) {
      if (Math.random() < 0.1) {
        this.setNext(x, y, ICE);
        return true;
      }
    }
  }

  stepFunction(c: CellState, x: number, y: number, _?: number) {
    if (this.changedGrid.has(x, y)) return;

    switch (c) {
      case VAPOR:
        if (this.raises(c, x, y)) return;
        if (this.condenses(c, x, y)) return;
        if (this.sloshes(c, x, y)) return;
      case EMPTY:
      case WALL:
        return;
      case WATER:
        if (this.falls(c, x, y)) return;
        if (this.flows(c, x, y)) return;
        if (this.evaporates(c, x, y)) return;
        if (this.freezes(c, x, y)) return;
        if (this.sloshes(c, x, y)) return;
        return;
      case SAND:
        if (this.falls(c, x, y)) return;
        if (this.flows(c, x, y)) return;
        return;
      case ICE:
        if (this.melts(c, x, y)) return;
        if (this.falls(c, x, y)) return;
        return;
      default:
        if (this.falls(c, x, y)) return;
    }

    return;
  }

  refreshStats() {
    this.stats.H2O =
      this.worldCountWhen(WATER) +
      this.worldCountWhen(ICE) +
      this.worldCountWhen(VAPOR);
  }
}

// TODO: Sublimation
