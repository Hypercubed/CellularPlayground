/* A 4-state CA created by Brian Silverman.  WireWorld models the flow of
currents in wires and makes it relatively easy to build logic gates
and other digital circuits. */

import { ALIVE, createState, DEAD, Game, GameOptions } from "./game";

const HEAD = createState("electron", "⚡︎");
const TAIL = createState("tail", "■");

const States = [ALIVE, HEAD, TAIL, DEAD];
const Pallet = [
  [ALIVE, DEAD],
  [HEAD, TAIL],
];

const diodes =
  "$$$$$$3b1■1⚡︎3o7b1■1⚡︎$2b1o5b7o1■1b3o$3b5o7b1■1⚡︎3b1o$20b1o$20b1o$20b1o$20b1o$21b1o$20b3o1■1⚡︎5o$21b1o$20b1o$20b1o$20b1o$20b1o$3b1■1⚡︎3o7b1■1⚡︎3b1o$2b1o5b7o1b1⚡︎3o$3b5o7b1■1⚡︎";

export class WireWorld extends Game {
  readonly patterns = ["", diodes];

  stats = {
    Step: 0,
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
    const a = this.getCell(x, y);
    if (a.state === HEAD.state) return TAIL;
    if (a.state === TAIL.state) return ALIVE;
    if (a.state === ALIVE.state) {
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
