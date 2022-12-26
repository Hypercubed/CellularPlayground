import { Game, CellState } from "./game";

interface CityState extends CellState {
  state: string;
  token: string;
  density: number;
  desire: number;
}

export function createState(state: string, token = state): Readonly<CityState> {
  return {
    state,
    token,
    density: 0,
    desire: 0,
  };
}

const EMPTY = createState("□");
const RESIDENTIAL = createState("⌂");
const INDUSTRIAL = createState("I");
const COMMERCIAL = createState("C");
const OBSTACLE = createState("■");

export class City extends Game<CityState> {
  stats = {
    Step: 0,
    $: 0,
    C: 0,
    I: 0,
    R: 0,
  };

  sizeX = 5;
  sizeY = 5;

  states = [RESIDENTIAL, OBSTACLE, COMMERCIAL, INDUSTRIAL, EMPTY];
  pallet = [[RESIDENTIAL, OBSTACLE, COMMERCIAL, INDUSTRIAL], [EMPTY]];

  constructor() {
    super();
    this.fillWith(EMPTY);
  }

  reset() {
    this.fillWith(EMPTY);
    this.stats.Step = 0;
    this.refreshStats();
  }

  getNextCell(y: number, x: number): CityState {
    const c = this.getCell(y, x);

    const rNeighbors = this.getNeighborsWhen(y, x, RESIDENTIAL);
    const iNeighbors = this.getNeighborsWhen(y, x, INDUSTRIAL);
    const cNeighbors = this.getNeighborsWhen(y, x, COMMERCIAL);

    const rDensity = rNeighbors.reduce((acc, n) => acc + n.density, 0);
    const iDensity = iNeighbors.reduce((acc, n) => acc + n.density, 0);
    const cDensity = cNeighbors.reduce((acc, n) => acc + n.density, 0);

    const density = Math.max((rDensity + iDensity + cDensity) / 8 + 1, 1);

    switch (c.state) {
      case RESIDENTIAL.state:
        return {
          ...c,
          density,
          desire: rDensity + cDensity - iDensity,
        };
      case INDUSTRIAL.state:
        return {
          ...c,
          density,
          desire: rDensity + cDensity,
        };
      case COMMERCIAL.state:
        return {
          ...c,
          density,
          desire: rDensity + iDensity,
        };
      default:
        return c;
    }
  }

  refreshStats() {
    this.stats.C = Math.floor(
      this.getWorldWhen(COMMERCIAL).reduce(
        (acc, c) => acc + c.desire * c.density,
        0
      )
    );
    this.stats.I = Math.floor(
      this.getWorldWhen(INDUSTRIAL).reduce(
        (acc, c) => acc + c.desire * c.density,
        0
      )
    );
    this.stats.R = Math.floor(
      this.getWorldWhen(RESIDENTIAL).reduce(
        (acc, c) => acc + c.desire * c.density,
        0
      )
    );

    this.stats.$ = this.stats.C + this.stats.I + this.stats.R;
  }
}
