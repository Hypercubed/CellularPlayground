import { CellState, createState, Game } from "./game";
import { clone } from "./utils";

const EMPTY = createState("□");
const ALIVE = createState("■");

const NEXT = createState("_");

export class Wolfram extends Game {
  stats = {
    Step: 0,
    Alive: 0,
  };

  size = 25;
  states = [ALIVE, EMPTY, NEXT];
  pallet = [ALIVE, EMPTY, NEXT];

  private rule: CellState[] = Array(8).fill(EMPTY);

  constructor(N: number = 30) {
    super();

    const s = ("00000000" + N.toString(2)).slice(-8);
    this.rule = this.rule
      .map((_, i) => {
        const n = s[i] === "1" ? ALIVE : EMPTY;
        return n;
      })
      .reverse();

    this.fillWith(EMPTY);
  }

  reset() {
    this.fillWith(EMPTY);
    this.grid[1].fill(NEXT);
    this.grid[0][Math.floor(this.size / 2)] = ALIVE;
    this.stats.Step = 0;
    this.refreshStats();
  }

  getNextCell(y: number, x: number) {
    const c = this.getCell(y, x);

    if (c.state === NEXT.state) {
      const b0 = +(this.getCell(y - 1, x + 1)?.state === ALIVE.state);
      const b1 = +(this.getCell(y - 1, x)?.state === ALIVE.state);
      const b2 = +(this.getCell(y - 1, x - 1)?.state === ALIVE.state);
      const s = b0 + b1 * 2 + b2 * 4;
      return this.rule[s];
    }

    const up = this.getCell(y - 1, x);
    if (up?.state === NEXT.state) return NEXT;

    return c;
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ALIVE);
  }
}
