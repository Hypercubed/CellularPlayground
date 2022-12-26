import { ALIVE, DEAD, Game, GameOptions } from "./game";

const LifeDefaultOptions = {
  sizeX: 40,
  sizeY: 40,
  continuous: false,
};

export class Life extends Game {
  stats = {
    Step: 0,
    Alive: 0,
  };

  states = [ALIVE, DEAD];
  pallet = [[ALIVE, DEAD]];

  birth: number[];
  survive: number[];

  constructor(ruleString: string = 'b3s23', options?: Partial<GameOptions>) {
    super({
      ...LifeDefaultOptions,
      ...options,
    });

    ruleString = ruleString.toLowerCase();

    const [, b, s] = ruleString.split(/[sbSB]+/);

    this.birth = b.split('').map(Number);
    this.survive = s.split('').map(Number);
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
