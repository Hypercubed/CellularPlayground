import { ACTIVE, EMPTY, CA, CAOptions } from '../classes/base';
import { createState } from '../classes/states';

const RainDefaultOptions = {
  width: 40,
  height: 40,
  continuous: false,
};

const DROP = createState('drop', '*');

export class Rain extends CA {
  readonly patterns = [''];

  stats = {
    Step: 0,
    Drops: 0,
  };

  states = [ACTIVE, DROP, EMPTY];
  pallet = [[ACTIVE, DROP, EMPTY]];

  constructor(options?: Partial<CAOptions>) {
    super({
      ...RainDefaultOptions,
      ...options,
    });
  }

  getNextCell(x: number, y: number) {
    const c = this.get(x, y);

    if (c.state === EMPTY.state) {
      if (y === 0) return Math.random() < 0.1 ? DROP : EMPTY;
      if (y === this.height) return c;

      return this.get(x, y - 1);
    }

    if (c.state === DROP.state) {
      const down = this.get(x, y + 1)?.state === EMPTY.state;
      if (down) return EMPTY;

      const up = this.get(x, y - 1)?.state === EMPTY.state;
      if (up) return Math.random() < 0.2 ? EMPTY : DROP;
    }

    if (c.state === ACTIVE.state) {
      // SAND
      if (y >= this.height - 1) return c;

      const down = this.get(x, y + 1);
      if (down?.state === EMPTY.state) return EMPTY;

      // const down_left = this.get(x - 1, y + 1);
      // if (down?.state === EMPTY.state) return EMPTY;

      // const down_right = this.get(x + 1, y + 1);
      // if (down?.state === EMPTY.state) return EMPTY;
    }

    return c;
  }

  refreshStats() {
    this.stats.Drops = this.worldCountWhen(ACTIVE);
  }
}
