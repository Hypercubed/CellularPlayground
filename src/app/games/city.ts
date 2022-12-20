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

    this.fillWith(EMPTY);
  }

  reset() {
    this.fillWith(EMPTY);
    this.stats.Step = 0;
    this.refreshStats();
  }

  getNextCell(y: number, x: number) {
    const a = this.getCell(y, x);

    if (a.state === EMPTY.state) {
      const r = this.regionCountWhen(y, x, 1, RESIDENTIAL);
      const i = this.regionCountWhen(y, x, 1, INDUSTRIAL);
      const c = this.regionCountWhen(y, x, 1, COMMERCIAL);

      const rw = this.worldCountWhen(RESIDENTIAL);
      const iw = this.worldCountWhen(INDUSTRIAL);
      const cw = this.worldCountWhen(COMMERCIAL);

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

  refreshStats() {
    this.stats.Alive = this.worldCountWhen(RESIDENTIAL);
  }
}
