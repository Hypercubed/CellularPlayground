import { BoundaryType, CA, CAOptions } from '../classes/base';
import { UnboundedGrid } from '../classes/grid';
import { createState } from '../classes/states';

import type { CellState } from '../classes/states';

enum Color {
  WHITE = '□',
  BLACK = '■',
}

enum Direction {
  UP = '▲',
  RIGHT = '►',
  DOWN = '▼',
  LEFT = '◄',
}

const BLACK = createState(Color.BLACK, Color.BLACK, '');
const WHITE = createState(Color.WHITE, Color.WHITE, '');

function createAntState(
  direction: Direction,
  color: Color
): Readonly<CellState> {
  return {
    state: color + direction,
    token: direction,
    display: '◄',
  };
}

const BLACK_UP = createAntState(Direction.UP, Color.BLACK);
const BLACK_RIGHT = createAntState(Direction.RIGHT, Color.BLACK);
const BLACK_DOWN = createAntState(Direction.DOWN, Color.BLACK);
const BLACK_LEFT = createAntState(Direction.LEFT, Color.BLACK);
const WHITE_UP = createAntState(Direction.UP, Color.WHITE);
const WHITE_RIGHT = createAntState(Direction.RIGHT, Color.WHITE);
const WHITE_DOWN = createAntState(Direction.DOWN, Color.WHITE);
const WHITE_LEFT = createAntState(Direction.LEFT, Color.WHITE);

function isAnt(t: CellState): boolean {
  return t.state.length === 2;
}

const AntOptionsDefault: Partial<CAOptions> = {
  width: 64,
  height: 64,
  boundaryType: BoundaryType.Infinite,
  neighborhoodRange: 0,
};

export class Ant extends CA {
  static readonly title = "Langton's Ant";
  static readonly description = `
    Langton's Ant is a two-dimensional universal Turing machine with a very simple set of rules but complex emergent behavior.

    References:
    http://mathworld.wolfram.com/LangtonsAnt.html
    https://en.wikipedia.org/wiki/Langton's_ant`;
  static readonly options: Partial<CAOptions>[] = [
    { title: 'Default', ...AntOptionsDefault },
    {
      title: 'Torus',
      boundaryType: BoundaryType.Torus,
      width: 39,
      height: 39, ...AntOptionsDefault
    },
  ];
  static readonly patterns = [];
  static readonly startingPattern = '▲';
  static readonly className = 'ant';

  stats = {
    Generation: 0,
    Ants: 0,
  };

  states = [
    BLACK,
    WHITE_UP,
    WHITE_DOWN,
    WHITE_LEFT,
    WHITE_RIGHT,
    BLACK_UP,
    BLACK_DOWN,
    BLACK_LEFT,
    BLACK_RIGHT,
    WHITE,
  ];

  pallet = [
    [WHITE_UP, WHITE_RIGHT, WHITE_DOWN, WHITE_LEFT],
    [BLACK_UP, BLACK_RIGHT, BLACK_DOWN, BLACK_LEFT],
    [BLACK, WHITE],
  ];

  private rule = 'RL';

  constructor(options?: Partial<CAOptions>) {
    super({
      ...AntOptionsDefault,
      ...options,
    });

    this.rule = 'RL'; // Right on black, left on white
  }

  refreshStats() {
    this.stats.Generation = this.step;
    this.stats.Ants = this.currentGrid.reduce((c, cell) => c + +isAnt(cell), 0);
  }

  // At a white square, turn 90° clockwise, flip the color of the square, move forward one unit
  // At a black square, turn 90° counter-clockwise, flip the color of the square, move forward one unit
  stepFunction(c: CellState, x: number, y: number) {
    if (!isAnt(c)) return;

    [x, y] = this.getPosition(x, y);

    const color = getCellColor(c);
    const dir = hetAntDirection(c);

    // Flip the color
    const newColor = color === Color.WHITE ? BLACK : WHITE;
    this._setNext(x, y, newColor);

    // Turn
    const ci = color === Color.WHITE ? 1 : 0;
    const newDir = turn(dir, this.rule[ci] as 'L' | 'R');

    // Move
    const [xx, yy] = this.getPosition(...getNextPosition(newDir, x, y));
    const nextColor = getCellColor(this._get(xx, yy));
    const nextState = getAntStane(newDir, nextColor);
    this._setNext(xx, yy, nextState);
  }
}

function getAntStane(direction: string, color: Color) {
  switch (direction) {
    case Direction.UP:
      return color === Color.WHITE ? WHITE_UP : BLACK_UP;
    case Direction.RIGHT:
      return color === Color.WHITE ? WHITE_RIGHT : BLACK_RIGHT;
    case Direction.DOWN:
      return color === Color.WHITE ? WHITE_DOWN : BLACK_DOWN;
    case Direction.LEFT:
      return color === Color.WHITE ? WHITE_LEFT : BLACK_LEFT;
  }
}

function getCellColor(s: CellState): Color {
  if (!s) return null;
  return (s.state[0] as Color) || null;
}

function hetAntDirection(s: CellState): Direction {
  if (!s) return null;
  return (s.state[1] as Direction) || null;
}

function getNextPosition(
  dir: Direction,
  x: number,
  y: number
): [number, number] {
  switch (dir) {
    case Direction.UP:
      return [x, y - 1];
    case Direction.RIGHT:
      return [x + 1, y];
    case Direction.DOWN:
      return [x, y + 1];
    case Direction.LEFT:
      return [x - 1, y];
  }
}

function turn(direction: Direction, to: 'L' | 'R'): Direction {
  switch (direction) {
    case Direction.UP:
      return to === 'L' ? Direction.LEFT : Direction.RIGHT;
    case Direction.RIGHT:
      return to === 'L' ? Direction.UP : Direction.DOWN;
    case Direction.DOWN:
      return to === 'L' ? Direction.RIGHT : Direction.LEFT;
    case Direction.LEFT:
      return to === 'L' ? Direction.DOWN : Direction.UP;
  }
}
