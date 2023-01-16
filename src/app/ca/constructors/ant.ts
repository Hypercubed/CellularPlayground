import { BoundaryType, CA, CAOptions } from '../classes/base';
import { UnboundedGrid } from '../classes/grid';
import { createState } from '../classes/states';

import { type CellState } from '../classes/states';

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

const AntOptionsDefault = {
  width: 64,
  height: 64,
  boundaryType: BoundaryType.Infinite,
};

export class Ant extends CA {
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
    [WHITE_UP],
    [BLACK, WHITE],
  ];

  constructor(options?: Partial<CAOptions>) {
    super({
      ...AntOptionsDefault,
      ...options,
    });
  }

  refreshStats() {
    this.stats.Generation = this.step;
    this.stats.Ants = this.currentGrid.reduce((c, cell) => c + +(isAnt(cell)), 0);
  }

  // At a white square, turn 90° clockwise, flip the color of the square, move forward one unit
  // At a black square, turn 90° counter-clockwise, flip the color of the square, move forward one unit
  doStep() {
    const lastChanges = this.changedGrid;
    this.changedGrid = new UnboundedGrid<CellState>();

    lastChanges.forEach((c, x, y) => {
      if (!isAnt(c)) return;

      const color = getColor(c);
      const dir = getDirection(c);

      // Flip the color
      const newColor = color === Color.WHITE ? BLACK : WHITE;
      this.setNext(x, y, newColor);

      // Turn
      const newDir = getNextDirection(dir, color);
      
      // Move
      const [xx, yy] = getNextPosition(newDir, x, y);
      const nextColor = getColor(this.get(xx, yy));
      const nextState = getState(newDir, nextColor);
      
      this.setNext(xx, yy, nextState);
    });

    this.currentGrid.assign(this.changedGrid);
    this.step++;
  }
}

function getState(direction: string, color: Color) {
  if (color === Color.WHITE) {
    switch (direction) {
      case Direction.UP:
        return WHITE_UP;
      case Direction.RIGHT:
        return WHITE_RIGHT;
      case Direction.DOWN:
        return WHITE_DOWN;
      case Direction.LEFT:
        return WHITE_LEFT;
    }
  } else {
    switch (direction) {
      case Direction.UP:
        return BLACK_UP;
      case Direction.RIGHT:
        return BLACK_RIGHT;
      case Direction.DOWN:
        return BLACK_DOWN;
      case Direction.LEFT:
        return BLACK_LEFT;
    }
  }
}

function getColor(s: CellState): Color {
  if (!s) return null;
  return (s.state[0] as Color) || null;
}

function getDirection(s: CellState): Direction {
  if (!s) return null;
  return (s.state[1] as Direction) || null;
}

function getNextPosition(dir: Direction, x: number, y: number) {
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

function getNextDirection(direction: Direction, color: Color): Direction {
  if (color === Color.WHITE) {
    switch (direction) {
      case Direction.UP:
        return Direction.RIGHT;
      case Direction.RIGHT:
        return Direction.DOWN;
      case Direction.DOWN:
        return Direction.LEFT;
      case Direction.LEFT:
        return Direction.UP;
    }
  }
  switch (direction) {
    case Direction.UP:
      return Direction.LEFT;
    case Direction.RIGHT:
      return Direction.UP;
    case Direction.DOWN:
      return Direction.RIGHT;
    case Direction.LEFT:
      return Direction.DOWN;
  }
}
