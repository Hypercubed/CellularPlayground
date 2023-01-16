import { BoundaryType, CAOptions } from '../classes/base';
import { OCA } from '../classes/elementary';
import { UnboundedGrid } from '../classes/grid';
import { createState, CellState } from '../classes/states';

type TuringRules = Record<string, string>;

interface BBOptions extends CAOptions {
  rules: TuringRules;
  headStates: string[];
  tapeStates: string[];
}

export const bb2 = {
  A0: '1RB',
  A1: '1LB',
  B0: '1LA',
  B1: '1RH',
};

export const bb3 = {
  A0: '1RB',
  A1: '1RH',
  B0: '0RC',
  B1: '1RB',
  C0: '1LC',
  C1: '1LA',
};

export const bb4 = {
  A0: '1RB',
  A1: '1LB',
  B0: '1LA',
  B1: '0LC',
  C0: '1RH',
  C1: '1LD',
  D0: '1RD',
  D1: '0RA',
};

export const bb5 = {
  A0: '1RB',
  A1: '1LC',
  B0: '1RC',
  B1: '1RB',
  C0: '1RD',
  C1: '0LE',
  D0: '1LA',
  D1: '1LD',
  E0: '1RH',
  E1: '0LA',
};

const BBOptionsDefault = {
  oneDimensional: true,
  width: 29,
  height: 29,
  boundaryType: BoundaryType.Infinite,
  rules: bb2,
};

export class BB extends OCA<CellState, BBOptions> {
  stats = {
    S: 0,
    Σ: 0,
  };

  protected rules: TuringRules;
  protected tapeStates: string[];
  protected headStates: string[];

  constructor(options?: Partial<BBOptions>) {
    super({
      ...BBOptionsDefault,
      ...options,
    });

    this.rules = this.options.rules;

    const ruleKeys = Object.keys(this.rules);

    this.headStates =
      this.options.headStates ||
      ruleKeys.map((k) => k[0]).filter((v, i, a) => a.indexOf(v) === i);
    this.tapeStates =
      this.options.tapeStates ||
      ruleKeys.map((k) => k[1]).filter((v, i, a) => a.indexOf(v) === i);

    this.headStates.push('H');

    const headStates = [];
    const tapeStates = [];

    this.tapeStates.forEach((t, j) => {
      tapeStates.unshift(createState(t, String(j), ' '));
      this.headStates.forEach((h, i) => {
        h = h.toUpperCase();
        headStates.push(
          createState(
            h + t,
            String.fromCharCode(65 + i + j * this.headStates.length),
            h
          )
        );
      });
    });

    this.pallet = [tapeStates, [headStates[0]]];
    this.states = [
      ...tapeStates.slice(0, -1),
      ...headStates,
      tapeStates[tapeStates.length - 1],
    ];

    this.rules = this.options.rules;
  }

  doStep() {
    const lastChanges = this.changedGrid;
    this.changedGrid = new UnboundedGrid<CellState>();

    // For each cell that changed on the previous tick (and neighbors)
    lastChanges.forEach((c, x, y) => {
      if (y !== this.step) return;
      const yy = y + 1;

      // Cell was already visited, skip
      if (this.changedGrid.has(x, yy)) return;

      if (!isHead(c) || c.state[0] === 'H') {
        this.setNext(x, yy, c);
        return;
      }

      // Write to tape
      const rule = this.rules?.[c.state];
      const write = String(rule[0]);
      const writeState = this.states.find((s) => s.state === write);
      this.setNext(x, yy, writeState);

      // Move head
      const direction = rule[1];
      const xx = direction === 'L' ? x - 1 : x + 1;
      const nextCell = this.get(xx, y);
      const nextState = this.findState(rule[2] + getTapeState(nextCell));
      // console.log(rule[2], xx, yy, nextState);
      // console.log(this.states);
      this.setNext(xx, yy, nextState);
    });

    this.currentGrid.assign(this.changedGrid);
    this.step++;
  }

  // protected doCell(x: number, y: number, R: number) {
  //   if (y !== this.step) return;

  //   // for each neighbor in range
  //   for (let p = -R; p <= R; p++) {
  //     const [xx, yy] = this.getPosition(x + p, this.step + 1);

  //     // Cell was already visited, skip
  //     if (this.changedGrid.has(xx, yy)) continue;

  //     const c = this.get(xx, yy);
  //     const n = this.getNextCell(c, xx, yy) || c;
  //     this.setNext(xx, yy, n);
  //   }
  // }

  // // 2-symbol busy beaver
  // getNextCell(_: CellState, x: number, y: number) {
  //   const up = this.get(x, y - 1);
  //   if (isHead(up)) {
  //     const rule = this.rules?.[up.state];
  //     if (rule) {
  //       const write = String(this.rules[up.state][0]);
  //       return this.states.find((s) => s.state === write);
  //     }
  //   }

  //   const up_right = this.get(x + 1, y - 1);
  //   if (isHead(up_right)) {
  //     const next = this.rules[up_right.state];
  //     if (next?.[1] === 'L') {
  //       return this.findState(next[2] + this.getTapeState(up));
  //     }
  //     return up;
  //   }

  //   const up_left = this.get(x - 1, y - 1);
  //   if (isHead(up_left)) {
  //     const next = this.rules[up_left.state];
  //     if (next?.[1] === 'R') {
  //       return this.findState(next[2] + this.getTapeState(up));
  //     }
  //     return up;
  //   }

  //   return up;
  // }

  refreshStats() {
    const yMin = this.stats.S;
    const yMax = this.step + 1;

    for (let y = yMin; y < yMax; y++) {
      let Σ = 0;
      let H = false;

      this.currentGrid.forEach((c, _, yy) => {
        if (y !== yy) return;

        Σ += c.state.endsWith('1') ? 1 : 0;
        if (c.state.startsWith('H')) H = true;
      });

      this.stats.S = y;
      this.stats.Σ = Σ;

      if (H) {
        break;
      }
    }
  }
}

function getTapeState(c: CellState): string {
  return c.state[c.state.length - 1];
}

function isHead(c: CellState): boolean {
  return c.state.length > 1;
}
