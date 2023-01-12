import { ACTIVE, EMPTY, CA, CAOptions, BoundaryType } from '../classes/base';
import parseRuleString from 'cellular-automata-rule-parser/formats/vote';
import { CellState } from '../classes/states';

export interface VoteOptions extends CAOptions {
  ruleString: string;
}

const VoteDefaultOptions: VoteOptions = {
  width: 64,
  height: 64,
  ruleString: '56789', // Majority
  boundaryType: BoundaryType.Wall,
};

export const OSCILLATOR = `6b2ob$5b4o$5b4o$b2o3b2ob$7o$4o$b2o2b3ob$5b4o$5b4o$6b2ob`;

export class Vote extends CA {
  stats: Record<string, any> = {
    Alive: 0,
  };

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  protected options: VoteOptions;
  protected vote: number[];

  constructor(options?: Partial<VoteOptions>) {
    super({
      ...VoteDefaultOptions,
      ...options,
    });

    this.options.ruleString = this.options.ruleString.toUpperCase();
    const rule = parseRuleString(this.options.ruleString.toUpperCase());

    // TODO: M and V extension and range
    this.vote = rule.vote;
  }

  getNextCell(_: CellState, x: number, y: number) {
    const s = this.neighborhoodCountWhen(x, y, ACTIVE);
    return this.vote.indexOf(s) > -1 ? ACTIVE : EMPTY;
  }
}
