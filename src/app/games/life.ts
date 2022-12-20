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
    this.fillWith(DEAD);
  }

  reset() {
    this.fillWith(DEAD);
    this.stats.Step = 0;
    this.refreshStats();
  }

  getNextCell(y: number, x: number) {
    const a = this.grid[y][x].state === ALIVE.state ? 1 : 0;
    const s = this.neighborhoodCountWhen(y, x, ALIVE);
    return s - a === 3 || s === 3 ? ALIVE : DEAD;
  }

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(ALIVE);
  }
}
