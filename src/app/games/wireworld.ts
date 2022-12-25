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

  sizeX = 30;
  sizeY = 30;

  states = [CONDUCTOR, HEAD, TAIL, EMPTY];
  pallet = [CONDUCTOR, HEAD, TAIL, EMPTY];

  constructor() {
    super();
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
  getNextCell(x: number, y: number) {
    const a = this.getCell(x, y);
    if (a.state === HEAD.state) return TAIL;
    if (a.state === TAIL.state) return CONDUCTOR;
    if (a.state === CONDUCTOR.state) {
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
