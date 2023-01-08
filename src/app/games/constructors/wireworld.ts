/* A 4-state CA created by Brian Silverman.  WireWorld models the flow of
currents in wires and makes it relatively easy to build logic gates
and other digital circuits. */

import { ACTIVE, createState, EMPTY, Game, GameOptions } from '../game';

const HEAD = createState('electron', 'e', '⚡︎');
const TAIL = createState('tail', '■', '');

const States = [ACTIVE, HEAD, TAIL, EMPTY];
const Pallet = [
  [ACTIVE, EMPTY],
  [HEAD, TAIL],
];

export const Diodes = '11b2o$10b2ob3o$9bob2o$9bo$bo■e2o3bo$o5bo2bo$o5b3o$o5bo2bo$b5o3bo$9bo$9bob2o$10bob4o$11b2o';

export class WireWorld extends Game {
  stats = {
    Electrons: 0,
  };

  width = 30;
  height = 30;

  readonly states = States;
  readonly pallet = Pallet;

  constructor(options?: Partial<GameOptions>) {
    super(options);
  }

  /*
  Empty → Empty
  Electron head → Electron tail
  Electron tail → Conductor
  Conductor → Electron head if exactly one or two of the neighboring cells are electron heads, or remains Conductor otherwise.
  */
  getNextCell(x: number, y: number) {
    const a = this.get(x, y);
    if (a.state === HEAD.state) return TAIL;
    if (a.state === TAIL.state) return ACTIVE;
    if (a.state === ACTIVE.state) {
      const c = this.neighborhoodCountWhen(x, y, HEAD);
      if (c === 1 || c === 2) {
        return HEAD;
      }
    }
    return a;
  }

  refreshStats() {
    this.stats.Electrons = this.worldCountWhen(HEAD);
  }
}
