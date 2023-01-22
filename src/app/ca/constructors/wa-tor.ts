// Inspired by the “Sharks and Fish on the Planet Wa-Tor” ecosystem simulation described in A. K. Dewdney's The Armchair Universe
// A. K. Dewdney, The Armchair Universe, W. H. Freeman: New York, 1988

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
  prey: string | null;
}

const EMPTY = _EMPTY as WaTorState;

interface WaTorOptions extends CAOptions {
  species: Record<string, Partial<WaTorState>>;
}

const DefaultOptions: Partial<WaTorOptions> = {
  width: 40,
  height: 40,
  boundaryType: BoundaryType.Torus,
  iterationType: IterationType.Active,
  neighborhoodRange: 0,
  species: {
    fish: {
      energy: Infinity,
      fertility: 4
    },
    shark: {
      energy: 3,
      fertility: 12,
      prey: 'fish'
    }
  }
};

export class WaTor extends CA<WaTorState> {
  states = [EMPTY];
  pallet = [[], [EMPTY]];

  private species: Record<string, Partial<WaTorState>> = {};

  constructor(options?: Partial<WaTorOptions>) {
    options = {
      ...DefaultOptions,
      ...options,
    };

    super(options);

    this.species = options.species;

    for (const [name, s] of Object.entries(this.species)) {
      const state = this.createState(name);
      this.states.unshift(state);
      this.pallet[0].push(state);
    }
  }

  createState(
    state: string,
    fertility: number = this.species[state].fertility,
    energy: number =this.species[state].energy,
    prey: string = this.species[state].prey
  ): WaTorState {
    return Object.freeze({
      state,
      token: state[0].toUpperCase(),
      display: '',
      fertility,
      energy,
      prey
    });
  }

  move(c: WaTorState, x: number, y: number, dx: number, dy: number) {
    const n = this.get(x + dx, y + dy);

    let { energy, fertility } = c;

    if (n !== EMPTY) {
      // Eats!
      energy += 2;
    } else {
      // otherwise loses energy
      energy--;
    }

    let o = EMPTY; // offspring
    if (fertility <= 0) {
      o = this.createState(c.state);
      fertility = this.species[c.state].fertility;
    } else {
      fertility--;
    }

    c = this.createState(c.state, fertility, energy);

    this.set(x + dx, y + dy, c);
    this.set(x, y, o);
  }

  stepFunction(c: WaTorState, x: number, y: number, _?: number) {
    if (this.changedGrid.has(x, y)) return;

    if (c === EMPTY) return;

    const neighbors = this.getVonNeumannNeighbors(x, y);
    
    // death
    if (c.energy <= 0) {
      this.set(x, y, EMPTY);
      return;
    }

    // find prey first
    if (c.prey) {
      const [dx, dy] = findRandomMove(neighbors, c.prey);
      if (dx !== null)
        return this.move(c, x, y, dx, dy);
    }

    // Otherwise just swim
    const [dx, dy] = findRandomMove(neighbors, EMPTY.state);
    if (dx !== null)
      return this.move(c, x, y, dx, dy);

    c = this.createState(c.state, c.fertility- 1, c.energy - 1);
    this.set(x, y, c);
  }

  refreshStats() {
    this.stats.Chronon = this.step;

    for (const [name, s] of Object.entries(this.species)) {
      this.stats[name] = this.worldCountWhen(name);
    }
  }
}

function findRandomMove(neighbors: WaTorState[], state: string) {
  const emptyNeighbors = neighbors
    .map((n, i) => (n.state === state ? i : null))
    .filter((n) => n !== null);
  if (emptyNeighbors.length > 0) {
    const i = Math.floor(Math.random() * emptyNeighbors.length);
    return getPosition(emptyNeighbors[i]);
  }
  return [null,null];
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
