import { createState, Game } from "./game";
import { matrix } from "./utils";

const DEAD = createState("□");
const ALIVE = createState("■");

export class Life extends Game {
  stats = {
    Step: 0,
    Alive: 0,
  };

  size = 19;
  states = [ALIVE, DEAD];
  pallet = [ALIVE, DEAD];

  constructor() {
    super();
    this.clearGridWith(DEAD);
  }

  reset() {
    this.clearGridWith(DEAD);
    this.stats.Step = 0;
    this.doStats();
  }

  getNextCell(y: number, x: number) {
    const a = this.grid[y][x].state === ALIVE.state ? 1 : 0;
    const s = this.neighborhoodCount(y, x, ALIVE);
    return s - a === 3 || s === 3 ? ALIVE : DEAD;
  }

  doStats() {
    this.stats.Alive = this.worldCount(ALIVE);
  }
}
