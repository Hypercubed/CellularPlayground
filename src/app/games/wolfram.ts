import { ALIVE, CellState, createState, DEAD, Game, GameOptions, makeGridWith } from "./game";

export const startingGrid = (sizeX: number = 43, sizeY: number = 22) =>
  makeGridWith(sizeX, sizeY, (x, y) => {
    if (y === 0 && x === Math.floor(sizeX / 2)) return ALIVE;
    return DEAD;
  });

const defaultWolframOptions = {
  sizeX: 43,
  sizeY: 22,
  continuous: false,
};

export class Wolfram extends Game {
  stats = {
    Step: 0,
    Alive: 0,
  };

  sizeX = 86 / 2;
  sizeY = 44 / 2;

  states = [ALIVE, DEAD];
  pallet = [[ALIVE, DEAD]];

  private rule: CellState[] = Array(8).fill(DEAD);

  constructor(N: number = 30, options?: Partial<GameOptions>) {
    super({
      ...defaultWolframOptions,
      ...options
    });

    const s = ("00000000" + N.toString(2)).slice(-8);
    this.rule = this.rule
      .map((_, i) => {
        const n = s[i] === "1" ? ALIVE : DEAD;
        return n;
      })
      .reverse();
  }

  reset() {
    this.currentGrid = startingGrid(this.sizeX, this.sizeY);
    this.stats.Step = 0;
    this.refreshStats();
  }

  getNextCell(x: number, y: number) {
    const c = this.getCell(x, y);

    if (c?.state === DEAD.state) {
      const b0 = +(this.getCell(x + 1, y - 1)?.state === ALIVE.state);
      const b1 = +(this.getCell(x, y - 1)?.state === ALIVE.state);
      const b2 = +(this.getCell(x - 1, y - 1)?.state === ALIVE.state);
      const s = b0 + b1 * 2 + b2 * 4;
      return this.rule[s];
    }

    // const up = this.getCell(x, y - 1);
    // if (up?.state === NEXT.state) return NEXT;

    return c;
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ALIVE);
  }
}
