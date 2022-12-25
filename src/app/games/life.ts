import { ALIVE, DEAD, Game, GameOptions } from "./game";

const LifeDefaultOptions = {
  sizeX: 19,
  sizeY: 19,
  continuous: false,
};

export class Life extends Game {
  stats = {
    Step: 0,
    Alive: 0,
  };

  states = [ALIVE, DEAD];
  pallet = [ALIVE, DEAD];

  constructor(options?: Partial<GameOptions>) {
    super({
      ...LifeDefaultOptions,
      ...options,
    });
  }

  getNextCell(x: number, y: number) {
    const c = this.getCell(x, y);
    const a = c.state === ALIVE.state ? 1 : 0;
    const s = this.neighborhoodCountWhen(x, y, ALIVE);
    return s - a === 3 || s === 3 ? ALIVE : DEAD;
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ALIVE);
  }
}
