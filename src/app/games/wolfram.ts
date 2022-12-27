import { ACTIVE, CellState, EMPTY, Game, GameOptions } from "./game";

const defaultWolframOptions = {
  width: 43,
  height: 22,
  continuous: false,
  N: 30,
};

interface WolframOptions extends GameOptions {
  N: number;
}

export class Wolfram extends Game<CellState, WolframOptions> {
  stats = {
    Step: 0,
    Alive: 0,
  };

  width = 86 / 2;
  height = 44 / 2;

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  private rule: CellState[] = Array(8).fill(EMPTY);

  constructor(options?: Partial<WolframOptions>) {
    super({
      ...defaultWolframOptions,
      ...options,
    });

    const s = ("00000000" + this.options.N.toString(2)).slice(-8);
    this.rule = this.rule
      .map((_, i) => {
        const n = s[i] === "1" ? ACTIVE : EMPTY;
        return n;
      })
      .reverse();
  }

  getNextCell(x: number, y: number) {
    const c = this.getCell(x, y);
    
    if (c?.state === EMPTY.state) {
      const b0 = +(this.getCell(x + 1, y - 1)?.state === ACTIVE.state);
      const b1 = +(this.getCell(x, y - 1)?.state === ACTIVE.state);
      const b2 = +(this.getCell(x - 1, y - 1)?.state === ACTIVE.state);
      const s = b0 + (b1 << 1) + (b2 << 2);
      return this.rule[s];
    }

    return c;
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ACTIVE);
  }
}
