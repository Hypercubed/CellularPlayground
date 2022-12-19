import { CellState, Game } from './game';
import { clone } from './utils';

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

const BLACK = {
  state: Colors.BLACK,
  token: Colors.BLACK,
  showInPallet: true
}

const WHITE = {
  state: Colors.WHITE,
  token: Colors.WHITE,
  showInPallet: true
}

function createAntState(direction: Directions, color: Colors): Readonly<CellState> {
  return {
    state: color + direction,
    token: direction
  }
}

const BLACK_UP = createAntState(Directions.UP, Colors.BLACK);
const BLACK_RIGHT = createAntState(Directions.RIGHT, Colors.BLACK);
const BLACK_DOWN = createAntState(Directions.DOWN, Colors.BLACK);
const BLACK_LEFT = createAntState(Directions.LEFT, Colors.BLACK);
const WHITE_UP = createAntState(Directions.UP, Colors.WHITE);
const WHITE_RIGHT = createAntState(Directions.RIGHT, Colors.WHITE);
const WHITE_DOWN = createAntState(Directions.DOWN, Colors.WHITE);
const WHITE_LEFT = createAntState(Directions.LEFT, Colors.WHITE);

export class Ant extends Game {
  stats = {
    Step: 0,
    Alive: 0,
  };

  states = [
    WHITE_UP, WHITE_DOWN, WHITE_LEFT, WHITE_RIGHT,
    BLACK_UP, BLACK_DOWN, BLACK_LEFT, BLACK_RIGHT,
    WHITE, BLACK,
  ];

  pallet = [
    WHITE_UP,
    WHITE, BLACK,
  ];

  constructor() {
    super();

    this.size = 19;
    this.states = [
      WHITE_UP, WHITE_DOWN, WHITE_LEFT, WHITE_RIGHT,
      BLACK_UP, BLACK_DOWN, BLACK_LEFT, BLACK_RIGHT,
      WHITE, BLACK,
    ];

    this.clearGridWith(WHITE);
  }

  reset() {
    this.stats.Step = 0;
    this.clearGridWith(WHITE);
    this.doStats();
  }

  doStep() {
    this.grid = this.getNextField();
    this.stats.Step++;
  }

  doStats() {
    this.stats.Alive =
      this.size * this.size - this.worldCount(WHITE) - this.worldCount(BLACK);
  }

  private getNextField(): CellState[][] {
    const X = clone(this.grid);

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const t = this.getCell(j, i);
        if (t.state !== WHITE.state && t.state !== BLACK.state) {
          const currentColor = this.getColor(t);

          // Rotate
          const currentDirection = this.getDirection(t);
          const newDirection = this.getNextDirection(currentDirection, currentColor);

          // Flip the cell
          const newColor = currentColor === Colors.BLACK ? WHITE : BLACK;
          this.setCell(j, i, newColor, X);

          let x = i;
          let y = j;

          switch (newDirection) {
            case Directions.UP:
              y--;
              break;
            case Directions.RIGHT:
              x++;
              break;
            case Directions.DOWN:
              y++;
              break;
            case Directions.LEFT:
              x--;
              break;
          }


          // Step Forward
          const nextColor = this.getColor(this.getCell(y, x));
          const v = this.getState(newDirection, nextColor);

          this.setCell(y, x, v, X);
        }
      }
    }

    return X;
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
    if (!s) return Colors.WHITE;
    return s.state[0] as Colors;
  }

  private getDirection(s: CellState): Directions {
    return s.state[1] as Directions;
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
