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
      const up = this.getCell(x, y - 1)?.state === DROP.state;
      if (up) return DROP;

      const up_left = this.getCell(x - 1, y - 1)?.state === DROP.state;
      const left_blocked = this.getCell(x - 1, y)?.state === ACTIVE.state;
      if (up_left && left_blocked) return DROP;
      
      const up_right = this.getCell(x + 1, y - 1)?.state === DROP.state;
      const right_blocked = this.getCell(x + 1, y)?.state === ACTIVE.state;
      if (up_right && right_blocked) return DROP;
    }

    if (c.state === DROP.state) {
      const down = this.getCell(x, y + 1)?.state === EMPTY.state;
      const down_left = this.getCell(x - 1, y + 1)?.state === ACTIVE.state;
      const down_right = this.getCell(x + 1, y + 1)?.state === ACTIVE.state;

      if (down || down_left || down_right) return EMPTY;
    }

    return c;
  }

  refreshStats() {
    this.stats.Drops = this.worldCountWhen(ACTIVE);
  }
}
