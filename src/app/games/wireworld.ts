/* A 4-state CA created by Brian Silverman.  WireWorld models the flow of
currents in wires and makes it relatively easy to build logic gates
and other digital circuits. */

import { createState, Game } from "./game";
import { matrix } from "./utils";

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

    this.clearGridWith(EMPTY);
  }

  reset() {
    this.clearGridWith(EMPTY);
    this.stats.Step = 0;
    this.doStats();
  }

  getNextField() {
    const X = matrix(this.size, this.size, EMPTY);

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        X[j][i] = this.getNextCell(j, i);
      }
    }

    return X;
  }

  /*
Empty → Empty
Electron head → Electron tail
Electron tail → Conductor
Conductor → Electron head if exactly one or two of the neighbouring cells are electron heads, or remains Conductor otherwise.
*/

  getNextCell(y: number, x: number) {
    const a = this.grid[y][x];
    if (a.state === HEAD.state) {
      return TAIL;
    }
    if (a.state === TAIL.state) {
      return CONDUCTOR;
    }
    if (a.state === CONDUCTOR.state) {
      const c = this.neighborhoodCount(y, x, HEAD);
      if (c === 1 || c === 2) {
        return HEAD;
      }
    }
    return a;
  }

  doStep() {
    this.grid = this.getNextField();
    this.stats.Step++;
  }

  doStats() {
    this.stats.Electrons = this.worldCount(HEAD);
  }
}
