import { ACTIVE, EMPTY, CA, CAOptions } from '../classes/base';
import { CellState, createState } from '../classes/states';

const RainDefaultOptions = {
  width: 40,
  height: 40,
  continuous: false,
};

const SNOW = createState('drop', '*');
const ROCK = createState('rock', 'o');

const SAND = createState('sand', '.');
const SAND_L = createState('sand-l', '◀');
const SAND_R = createState('sand-r', '▶');

const WATER = createState('water', '-');
const WATER_L = createState('water', '<');
const WATER_R = createState('water', '>');

function isSand(s: CellState) {
  return s === SAND || s === SAND_L || s === SAND_R;
}

function isWater(s: CellState) {
  return s === WATER || s === WATER_L || s === WATER_R;
}

function moveDown(s: CellState) {
  if (isWater(s)) return WATER;
  if (isSand(s)) return SAND;
  return s;
}

function moveLeft(s: CellState) {
  if (isWater(s)) return WATER_L;
  if (isSand(s)) return SAND_L;
  return s;
}

function moveRight(s: CellState) {
  if (isWater(s)) return WATER_R;
  if (isSand(s)) return SAND_R;
  return s;
}

const density = [
  EMPTY,
  SNOW,
  WATER,
  WATER_L,
  WATER_R,
  SAND,
  SAND_L,
  SAND_R,
  ROCK,
];

export class Rain extends CA {
  readonly patterns = [''];

  stats = {
    Step: 0,
    Drops: 0,
  };

  states = [ROCK, SAND, SAND_L, SAND_R, WATER, WATER_L, WATER_R, SNOW, EMPTY];
  pallet = [[ROCK, SAND], [SNOW, WATER], [EMPTY]];

  neighborhoodRange = 2;
  stochastic = true;

  constructor(options?: Partial<CAOptions>) {
    super({
      ...RainDefaultOptions,
      ...options,
    });
  }

  getNextCell(c: CellState, x: number, y: number): CellState {
    const down = this.get(x, y + 1);
    const down_left = this.get(x - 1, y + 1);
    const down_right = this.get(x + 1, y + 1);

    const left = this.get(x - 1, y);
    const right = this.get(x + 1, y);

    if (this.step % 2) {
      const s = moveDown(c);
      switch (s) {
        case WATER:
          if (density.indexOf(down_right) > density.indexOf(s))
            return moveRight(s);
          if (density.indexOf(down_left) > density.indexOf(s))
            return moveLeft(s);
          if (left === EMPTY) return moveLeft(s);
          if (right === EMPTY) return moveRight(s);
          return WATER;
        case SAND:
          if (density.indexOf(down_right) > density.indexOf(s))
            return moveRight(s);
          if (density.indexOf(down_left) > density.indexOf(s))
            return moveLeft(s);
          return WATER;
      }
      return;
    }

    const up = this.get(x, y - 1);
    if (density.indexOf(up) > density.indexOf(c)) return moveDown(up);

    if (y >= this.height) return c;

    if (density.indexOf(down) < density.indexOf(c)) return moveDown(down);

    const up_left = this.get(x - 1, y - 1);
    const up_right = this.get(x + 1, y - 1);

    switch (c) {
      case EMPTY: {
        if (up_left === SAND_R) return SAND;
        if (up_right === SAND_L) return SAND;

        if (up_left === WATER_R) return WATER;
        if (up_right === WATER_L) return WATER;

        if (left === WATER_R) return WATER;
        if (right === WATER_L) return WATER;

        return;
      }
      case SNOW: {
        return Math.random() < 0.2 ? WATER : SNOW;
      }
      case SAND_L: {
        if (down_left === EMPTY) return EMPTY;
        return SAND;
      }
      case SAND_R: {
        if (down_right === EMPTY) return EMPTY;
        return SAND;
      }
      case WATER_L: {
        if (down_left === EMPTY) return EMPTY;
        if (left === EMPTY) return EMPTY;
        return WATER;
      }
      case WATER_R: {
        if (down_right === EMPTY) return EMPTY;
        if (left === EMPTY) return EMPTY;
        return WATER;
      }
    }

    return;
  }

  refreshStats() {
    this.stats.Drops = this.worldCountWhen(ACTIVE);
  }
}
