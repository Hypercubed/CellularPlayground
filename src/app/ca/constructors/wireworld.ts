/* A 4-state CA created by Brian Silverman.  WireWorld models the flow of
currents in wires and makes it relatively easy to build logic gates
and other digital circuits. */

import { ACTIVE, EMPTY, CA, CAOptions } from '../classes/base';
import { CellState, createState } from '../classes/states';

const HEAD = createState('electron', 'e', '⚡︎');
const TAIL = createState('tail', '■', '');

const States = [ACTIVE, HEAD, TAIL, EMPTY];
const Pallet = [
  [ACTIVE, EMPTY],
  [HEAD, TAIL],
];

export const Diodes =
  '11b2o$10b2ob3o$9bob2o$9bo$bo■e2o3bo$o5bo2bo$o5b3o$o5bo2bo$b5o3bo$9bo$9bob2o$10bob4o$11b2o';

export class WireWorld extends CA {
  // Static
  static readonly title = 'WireWorld';
  static readonly description =
    'Wireworld is particularly suited to simulating transistors, and is Turing-complete.';
  static readonly options: Partial<CAOptions>[] = [];
  static readonly patterns = [Diodes];
  static readonly className = 'wireworld';

  width = 30;

  readonly states = States;
  readonly pallet = Pallet;

  constructor(options?: Partial<CAOptions>) {
    super(options);
  }

  /*
  Empty → Empty
  Electron head → Electron tail
  Electron tail → Conductor
  Conductor → Electron head if exactly one or two of the neighboring cells are electron heads, or remains Conductor otherwise.
  */
  stateFunction(a: CellState, x: number, y: number) {
    switch (a.state) {
      case HEAD.state:
        return TAIL;
      case TAIL.state:
        return ACTIVE;
      case ACTIVE.state: {
        const c = this.neighborsCountWhen(x, y, HEAD);
        if (c === 1 || c === 2) {
          return HEAD;
        }
      }
      default:
        return a;
    }
  }

  refreshStats() {
    this.stats.Electrons = this.worldCountWhen(HEAD);
  }
}
