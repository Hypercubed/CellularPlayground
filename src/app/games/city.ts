import { createState, Game } from "./game";

const EMPTY = createState("□");
const RESIDENTIAL = createState("⌂");
const INDUSTRIAL = createState("I");
const COMMERCIAL = createState("C");
const OBSTACLE = createState("■");

export class City extends Game {
  stats = {
    Step: 0,
    Alive: 0,
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

  getNextCell(y: number, x: number) {
    const a = this.getCell(y, x);

    if (a.state === EMPTY.state) {
      const r = this.regionCount(y, x, 1, RESIDENTIAL);
      const i = this.regionCount(y, x, 1, INDUSTRIAL);
      const c = this.regionCount(y, x, 1, COMMERCIAL);

      const rw = this.worldCount(RESIDENTIAL);
      const iw = this.worldCount(INDUSTRIAL);
      const cw = this.worldCount(COMMERCIAL);

      if (r > 0 && rw < cw + iw && i === 0) {
        return RESIDENTIAL;
      }

      if (i > 0 && iw < cw) {
        return INDUSTRIAL;
      }

      if (r > 2 && c < r) {
        return COMMERCIAL;
      }
    }
    return a;
  }

  doStats() {
    this.stats.Alive = this.worldCount(RESIDENTIAL);
  }
}
