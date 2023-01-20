import {
  EMPTY as _EMPTY,
  CA,
  CAOptions,
  BoundaryType,
  IterationType,
} from '../classes/base';
import { CellState } from '../classes/states';

interface WaTorState extends CellState {
  fertility: number;
  energy: number;
}

export function createState(
  state: string,
  fertility = 0,
  energy = 0
): WaTorState {
  return Object.freeze({
    state,
    token: state[0].toUpperCase(),
    display: '',
    fertility,
    energy,
  });
}

const initial_energies = { fish: 2, shark: 3 };
const fertility_thresholds = { fish: 4, shark: 12 };

const SHARK = createState(
  'shark',
  fertility_thresholds['shark'],
  initial_energies['shark']
);
const FISH = createState(
  'fish',
  fertility_thresholds['fish'],
  initial_energies['fish']
);
const EMPTY = _EMPTY as WaTorState;

const DefaultOptions: Partial<CAOptions> = {
  width: 40,
  height: 40,
  boundaryType: BoundaryType.Torus,
  iterationType: IterationType.Active,
  neighborhoodRange: 0,
};

export class WaTor extends CA<WaTorState> {
  states = [SHARK, FISH, EMPTY];
  pallet = [[SHARK, FISH], [EMPTY]];

  protected rule: number[];

  constructor(options?: Partial<CAOptions>) {
    super({
      ...DefaultOptions,
      ...options,
    });
  }

  findRandomMove(neighbors: WaTorState[], STATE: WaTorState) {
    const emptyNeighbors = neighbors
      .map((n, i) => (n.state === STATE.state ? i : null))
      .filter((n) => n !== null);
    if (emptyNeighbors.length > 0) {
      const i = Math.floor(Math.random() * emptyNeighbors.length);
      return getPosition(emptyNeighbors[i]);
    }
    return;
  }

  move(c: WaTorState, x: number, y: number, dx: number, dy: number) {
    const n = this.get(x + dx, y + dy);

    let { energy, fertility } = c;

    fertility--;

    // Only sharks eat and loose energy
    if (c.state === SHARK.state) {
      if (n !== EMPTY) {
        // Eats!
        energy += n.energy;
      } else {
        // Only sharks loose energy
        energy--;
      }
    }

    let o = EMPTY; // offspring
    if (c.fertility <= 0) {
      o = createState(
        c.state,
        fertility_thresholds[c.state],
        initial_energies[c.state]
      );
      fertility = fertility_thresholds[c.state];
    }
    c = createState(c.state, fertility, energy);

    this.set(x + dx, y + dy, c);
    this.set(x, y, o);
  }

  stepFunction(c: WaTorState, x: number, y: number, _?: number) {
    if (this.changedGrid.has(x, y)) return;

    if (c === EMPTY) return;

    const neighbors = this.getVonNeumannNeighbors(x, y);

    switch (c.state) {
      case SHARK.state: {
        // Shark die
        if (c.energy <= 0) {
          this.set(x, y, EMPTY);
          return;
        }

        // Shark eat fish
        const p = this.findRandomMove(neighbors, FISH);
        if (p) {
          this.move(c, x, y, p[0], p[1]);
          return;
        }
      }
      case FISH.state: {
        // Sharks and fish swim
        const p = this.findRandomMove(neighbors, EMPTY);
        if (p) {
          this.move(c, x, y, p[0], p[1]);
        }
      }
    }
  }

  refreshStats() {
    this.stats.Chronon = this.step;
    this.stats.Fish = this.worldCountWhen(FISH);
    this.stats.Sharks = this.worldCountWhen(SHARK);
  }
}

function getPosition(i: number): [number, number] {
  switch (i) {
    case 0:
      return [0, -1];
    case 1:
      return [1, 0];
    case 2:
      return [0, 1];
    case 3:
      return [-1, 0];
  }
}
