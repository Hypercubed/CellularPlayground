import {
  BoundaryType,
  CAOptions,
} from '../classes/base';
import { ElementaryCA } from '../classes/elementary';
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

export class BB extends ElementaryCA<CellState, BBOptions> {
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

  // 2-symbol busy beaver
  getNextCell(x: number, y: number) {
    const c = this.get(x, y);

    const up = this.get(x, y - 1);
    if (isHead(up)) {
      const rule = this.rules?.[up.state];
      if (rule) {
        const write = String(this.rules[up.state][0]);
        return this.states.find((s) => s.state === write);
      }
    }

    const up_right = this.get(x + 1, y - 1);
    if (isHead(up_right)) {
      const next = this.rules[up_right.state];
      if (next?.[1] === 'L') {
        return this.findState(next[2] + this.getTapeState(up));
      }
      return up;
    }

    const up_left = this.get(x - 1, y - 1);
    if (isHead(up_left)) {
      const next = this.rules[up_left.state];
      if (next?.[1] === 'R') {
        return this.findState(next[2] + this.getTapeState(up));
      }
      return up;
    }

    return up;
  }

  findState(state: string) {
    return this.states.find((s) => s.state === state);
  }

  getTapeState(c: CellState): string {
    return c.state[c.state.length - 1];
  }

  refreshStats() {
    const yMin = this.stats.S;
    const yMax = this.step + 1;

    for (let y = yMin; y < yMax; y++) {
      let Σ = 0;
      let H = false;

      for (let x in this.currentGrid[y]) {
        const c = this.get(+x, +y);
        Σ += c.state.endsWith('1') ? 1 : 0;
        if (c.state.startsWith('H')) H = true;
      }

      this.stats.S = y;
      this.stats.Σ = Σ;

      if (H) {
        break;
      }
    }
  }
}

function isHead(c: CellState): boolean {
  return c.state.length > 1;
}

