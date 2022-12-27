import { ACTIVE, createState, EMPTY, Game, GameOptions } from "./game";

const RainDefaultOptions = {
  width: 40,
  height: 40,
  continuous: false,
}

const DROP = createState("drop", "*");

export class Rain extends Game {
  readonly patterns = [""];

  stats = {
    Step: 0,
    Drops: 0,
  };

  states = [ACTIVE, DROP, EMPTY];
  pallet = [[ACTIVE, DROP, EMPTY]];

  constructor(options?: Partial<GameOptions>) {
    super({
      ...RainDefaultOptions,
      ...options,
    });
  }

  getNextCell(x: number, y: number) {
    const c = this.getCell(x, y);

    if (c.state === EMPTY.state) {
      if (y === 0) return Math.random() < 0.1 ? DROP : EMPTY;
      if (y === this.height) return c;

      return this.getCell(x, y - 1);
    }

    if (c.state === DROP.state) {
      const down = this.getCell(x, y + 1)?.state === EMPTY.state;
      if (down) return EMPTY;

      const up = this.getCell(x, y - 1)?.state === EMPTY.state;
      if (up) return Math.random() < 0.2 ? EMPTY : DROP;
    }

    if (c.state === ACTIVE.state) {
      if (y >= this.height - 1) return c;
      const down = this.getCell(x, y + 1)?.state === EMPTY.state;
      if (down) return EMPTY;
    }

    return c;
  }

  refreshStats() {
    this.stats.Drops = this.worldCountWhen(ACTIVE);
  }
}
