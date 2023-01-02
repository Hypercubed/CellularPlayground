import { ACTIVE, EMPTY, Game, GameOptions } from './game';

export interface LifeOptions extends GameOptions {
  ruleString: string;
}

const LifeDefaultOptions = {
  width: 40,
  height: 40,
  continuous: false,
  ruleString: 'b3s23',
};

export class Life extends Game {
  stats = {
    Step: 0,
    Alive: 0,
  };

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

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

    this.birth = b.split('').map(Number);
    this.survive = s.split('').map(Number);
  }

  getNextCell(x: number, y: number) {
    const c = this.getCell(x, y);
    const s = this.neighborhoodCountWhen(x, y, ACTIVE);
    if (c.state === EMPTY.state) {
      return this.birth.includes(s) ? ACTIVE : EMPTY;
    } else if (c.state === ACTIVE.state) {
      return this.survive.includes(s) ? ACTIVE : EMPTY;
    }
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ACTIVE);
  }
}
