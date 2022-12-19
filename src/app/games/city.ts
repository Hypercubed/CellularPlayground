import { createState, Game } from "./game";
import { matrix } from "./utils";

const EMPTY = createState('□');
const RESIDENTIAL = createState('⌂');
const INDUSTRIAL = createState('I');
const COMMERCIAL = createState('C');
const OBSTACLE = createState('■');

export class City extends Game {
  stats = {
    Step: 0,
    Alive: 0
  };

  constructor() {
    super();

    this.size = 19;
    this.states = [RESIDENTIAL, OBSTACLE, COMMERCIAL, INDUSTRIAL, EMPTY];
    this.pallet = [RESIDENTIAL, OBSTACLE, COMMERCIAL, INDUSTRIAL, EMPTY];

    this.clearGridWith(EMPTY);
  }

  reset() {
    this.clearGridWith(EMPTY);
    this.stats.Step = 0;
    this.doStats();
  }

  getNextField() {
    const X = matrix(this.size, this.size, EMPTY);

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        X[j][i] = this.getNextCell(j, i);
      }
    }

    return X;
  }

  getNextCell(y: number, x: number) {
    const a = this.grid[y][x];
    const r = this.regionCount(y, x, 2, RESIDENTIAL);
    const i = this.regionCount(y, x, 2, INDUSTRIAL);
    const c = this.regionCount(y, x, 2, COMMERCIAL);

    if (a.state === EMPTY.state) {
      if (r >= 3 && i === 0) {
        return RESIDENTIAL;
      }

      if (c >= 3 && i === 0) {
        return COMMERCIAL;
      }

      if (c > r) {
        return RESIDENTIAL;
      }
  
      if (r > c) {
        return COMMERCIAL;
      }
    }
    return a;
  }

  doStep() {
    this.grid = this.getNextField();
    this.stats.Step++;
  }

  doStats() {
    this.stats.Alive = this.worldCount(RESIDENTIAL);
  }
}