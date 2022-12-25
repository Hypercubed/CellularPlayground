import { CellState, createState, Game } from "./game";

const EMPTY = createState("0");
const ALIVE = createState("1");

const NEXT = createState("_");

export class Wolfram extends Game {
  stats = {
    Step: 0,
    Alive: 0,
  };

  sizeX = 43;
  sizeY = 22;

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
    this.immediatelySetCell(Math.floor(this.sizeX / 2), 0, ALIVE);
    this.grid[1].fill(NEXT);
    this.stats.Step = 0;
    this.refreshStats();
  }

  getNextCell(x: number, y: number) {
    const c = this.getCell(x, y);

    if (c?.state === NEXT.state) {
      const b0 = +(this.getCell(x + 1, y - 1)?.state === ALIVE.state);
      const b1 = +(this.getCell(x, y - 1)?.state === ALIVE.state);
      const b2 = +(this.getCell(x - 1, y - 1)?.state === ALIVE.state);
      const s = b0 + b1 * 2 + b2 * 4;
      return this.rule[s];
    }

    const up = this.getCell(x, y - 1);
    if (up?.state === NEXT.state) return NEXT;

    return c;
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ALIVE);
  }
}
