import { ALIVE, CellState, DEAD, Game, GameOptions } from "./game";

const defaultWolframOptions = {
  width: 43,
  height: 22,
  continuous: false,
};

export class Wolfram extends Game {
  readonly patterns = ["21b1o"];

  stats = {
    Step: 0,
    Alive: 0,
  };

  width = 86 / 2;
  height = 44 / 2;

  states = [ALIVE, DEAD];
  pallet = [[ALIVE, DEAD]];

  private rule: CellState[] = Array(8).fill(DEAD);

  constructor(N: number = 30, options?: Partial<GameOptions>) {
    super({
      ...defaultWolframOptions,
      ...options,
    });

    const s = ("00000000" + N.toString(2)).slice(-8);
    this.rule = this.rule
      .map((_, i) => {
        const n = s[i] === "1" ? ALIVE : DEAD;
        return n;
      })
      .reverse();
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
