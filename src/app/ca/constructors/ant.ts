import { BoundaryType, CA, CAOptions } from '../classes/base';
import { createState } from '../classes/states';

import { type CellState } from '../classes/states';

enum Colors {
  WHITE = '□',
  BLACK = '■',
}

enum Directions {
  UP = '▲',
  RIGHT = '►',
  DOWN = '▼',
  LEFT = '◄',
}

const BLACK = createState(Colors.BLACK, Colors.BLACK, '');
const WHITE = createState(Colors.WHITE, Colors.WHITE, '');

function createAntState(
  direction: Directions,
  color: Colors
): Readonly<CellState> {
  return {
    state: color + direction,
    token: direction,
    display: direction,
  };
}

const BLACK_UP = createAntState(Directions.UP, Colors.BLACK);
const BLACK_RIGHT = createAntState(Directions.RIGHT, Colors.BLACK);
const BLACK_DOWN = createAntState(Directions.DOWN, Colors.BLACK);
const BLACK_LEFT = createAntState(Directions.LEFT, Colors.BLACK);
const WHITE_UP = createAntState(Directions.UP, Colors.WHITE);
const WHITE_RIGHT = createAntState(Directions.RIGHT, Colors.WHITE);
const WHITE_DOWN = createAntState(Directions.DOWN, Colors.WHITE);
const WHITE_LEFT = createAntState(Directions.LEFT, Colors.WHITE);

const AntOptionsDefault = {
  width: 39,
  height: 39,
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
    [WHITE_UP, WHITE_DOWN, WHITE_LEFT, WHITE_RIGHT],
    [BLACK_UP, BLACK_DOWN, BLACK_LEFT, BLACK_RIGHT],
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
    this.stats.Ants =
      this.worldCountWhen(BLACK_UP) +
      this.worldCountWhen(WHITE_UP) +
      this.worldCountWhen(BLACK_DOWN) +
      this.worldCountWhen(WHITE_DOWN) +
      this.worldCountWhen(BLACK_LEFT) +
      this.worldCountWhen(WHITE_LEFT) +
      this.worldCountWhen(BLACK_RIGHT) +
      this.worldCountWhen(WHITE_RIGHT);
  }

  // At a white square, turn 90° clockwise, flip the color of the square, move forward one unit
  // At a black square, turn 90° counter-clockwise, flip the color of the square, move forward one unit

  getNextCell(t: CellState, x: number, y: number) {
    const currentColor = this.getColor(t);

    if (this.getDirection(t)) {
      // On an ant
      // Flip the cell
      return currentColor === Colors.BLACK ? WHITE : BLACK;
    }

    const up = this.get(x, y - 1);
    if (this.getDirection(up) === Directions.DOWN) {
      const newDirection = this.getNextDirection(Directions.DOWN, currentColor);
      return this.getState(newDirection, currentColor);
    }

    const right = this.get(x + 1, y);
    if (this.getDirection(right) === Directions.LEFT) {
      const newDirection = this.getNextDirection(Directions.LEFT, currentColor);
      return this.getState(newDirection, currentColor);
    }

    const down = this.get(x, y + 1);
    if (this.getDirection(down) === Directions.UP) {
      const newDirection = this.getNextDirection(Directions.UP, currentColor);
      return this.getState(newDirection, currentColor);
    }

    const left = this.get(x - 1, y);
    if (this.getDirection(left) === Directions.RIGHT) {
      const newDirection = this.getNextDirection(
        Directions.RIGHT,
        currentColor
      );
      return this.getState(newDirection, currentColor);
    }
    return t;
  }

  private getState(direction: string, color: string) {
    if (color === Colors.WHITE) {
      switch (direction) {
        case Directions.UP:
          return WHITE_UP;
        case Directions.RIGHT:
          return WHITE_RIGHT;
        case Directions.DOWN:
          return WHITE_DOWN;
        case Directions.LEFT:
          return WHITE_LEFT;
      }
    } else {
      switch (direction) {
        case Directions.UP:
          return BLACK_UP;
        case Directions.RIGHT:
          return BLACK_RIGHT;
        case Directions.DOWN:
          return BLACK_DOWN;
        case Directions.LEFT:
          return BLACK_LEFT;
      }
    }
  }

  private getColor(s: CellState): Colors {
    if (!s) return null;
    return (s.state[0] as Colors) || null;
  }

  private getDirection(s: CellState): Directions {
    if (!s) return null;
    return (s.state[1] as Directions) || null;
  }

  private getNextDirection(direction: Directions, color: Colors): Directions {
    if (color === Colors.WHITE) {
      switch (direction) {
        case Directions.UP:
          return Directions.RIGHT;
        case Directions.RIGHT:
          return Directions.DOWN;
        case Directions.DOWN:
          return Directions.LEFT;
        case Directions.LEFT:
          return Directions.UP;
      }
    }
    switch (direction) {
      case Directions.UP:
        return Directions.LEFT;
      case Directions.RIGHT:
        return Directions.UP;
      case Directions.DOWN:
        return Directions.RIGHT;
      case Directions.LEFT:
        return Directions.DOWN;
    }
  }
}