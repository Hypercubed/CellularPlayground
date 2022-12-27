import { ALIVE, DEAD, Game, GameOptions } from "./game";

interface LifeOptions extends GameOptions {
  ruleString: string;
}

const LifeDefaultOptions = {
  width: 40,
  height: 40,
  continuous: false,
  ruleString: "b3s23",
};

export class Life extends Game {
  readonly patterns = [""];

  stats = {
    Step: 0,
    Alive: 0,
  };

  states = [ALIVE, DEAD];
  pallet = [[ALIVE, DEAD]];

  birth: number[];
  survive: number[];

  protected options: LifeOptions;

  constructor(options?: Partial<LifeOptions>) {
    super({
      ...LifeDefaultOptions,
      ...options,
    });

    const ruleString = this.options.ruleString.toLowerCase();

    const [, b, s] = ruleString.split(/[sbSB]+/);

    this.birth = b.split("").map(Number);
    this.survive = s.split("").map(Number);
  }

  getNextCell(x: number, y: number) {
    const c = this.getCell(x, y);
    const s = this.neighborhoodCountWhen(x, y, ALIVE);
    if (c.state === DEAD.state) {
      return this.birth.includes(s) ? ALIVE : DEAD;
    }
    return this.survive.includes(s) ? ALIVE : DEAD;
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ALIVE);
  }
}
