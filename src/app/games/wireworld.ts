/* A 4-state CA created by Brian Silverman.  WireWorld models the flow of
currents in wires and makes it relatively easy to build logic gates
and other digital circuits. */

import { createState, Game } from "./game";

const EMPTY = createState("empty", "□");
const HEAD = createState("head", "⚡︎");
const TAIL = createState("tail", "■");
const CONDUCTOR = createState("conductor", "■");

export class WireWorld extends Game {
  name = "WireWorld";

  stats = {
    Step: 0,
    Electrons: 0,
  };

  constructor() {
    super();

    this.size = 19;
    this.states = [CONDUCTOR, HEAD, TAIL, EMPTY];
    this.pallet = [CONDUCTOR, HEAD, TAIL, EMPTY];

    this.fillWith(EMPTY);
  }

  reset() {
    this.fillWith(EMPTY);
    this.stats.Step = 0;
    this.refreshStats();
  }

  /*
  Empty → Empty
  Electron head → Electron tail
  Electron tail → Conductor
  Conductor → Electron head if exactly one or two of the neighboring cells are electron heads, or remains Conductor otherwise.
  */
  getNextCell(y: number, x: number) {
    const a = this.grid[y][x];
    if (a.state === HEAD.state) return TAIL;
    if (a.state === TAIL.state) return CONDUCTOR;
    if (a.state === CONDUCTOR.state) {
      const c = this.neighborhoodCountWhen(y, x, HEAD);
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
