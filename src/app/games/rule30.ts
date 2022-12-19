import { CellState, createState, Game } from "./game";
import { clone, matrix } from "./utils";

const EMPTY = createState("□");
const ALIVE = createState("■");

const NEXT = createState(" ");

export class Rule30 extends Game {
  name = 'Rule30';

  stats = {
    Step: 0,
    Alive: 0,
  };

  size = 19;
  states = [ALIVE, EMPTY, NEXT];
  pallet = [ALIVE, EMPTY, NEXT];

  private rule: CellState[] = Array(8).fill(EMPTY);

  constructor(N: number = 30) {
    super();

    const s = ('00000000' + N.toString(2)).slice(-8);
    this.rule = this.rule.map((_, i) => {
      const n = s[i] === '1' ? ALIVE : EMPTY;
      return n;
    }).reverse();

    this.clearGridWith(EMPTY);
  }

  reset() {
    this.clearGridWith(EMPTY);
    this.grid[1].fill(NEXT);
    this.grid[0][9] = ALIVE;
    this.stats.Step = 0;
    this.doStats();
  }

  getNextField() {
    const X = clone(this.grid);

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const c = this.getCell(j, i);
        if (c.state === NEXT.state) {
          const n = this.getNextCell(j, i);
          this.setCell(j, i, n, X);
          this.setCell(j + 1, i, NEXT, X);
        }
      }
    }

    return X;
  }

  getNextCell(y: number, x: number) {
    const b0 = this.getCell(y - 1, x + 1)?.state === ALIVE.state ? 1 : 0;
    const b1 = this.getCell(y - 1, x)?.state === ALIVE.state ? 1 : 0;
    const b2 = this.getCell(y - 1, x - 1)?.state === ALIVE.state ? 1 : 0;

    const s = b0 + b1*2 + b2*4;
    return this.rule[s];
  }

  doStep() {
    this.grid = this.getNextField();
    this.stats.Step++;
  }

  doStats() {
    this.stats.Alive = this.worldCount(ALIVE);
  }
}
