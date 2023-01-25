import { ACTIVE, EMPTY, CA, CAOptions, BoundaryType } from '../classes/base';
import parseRuleString from 'cellular-automata-rule-parser/formats/vote';
import { CellState } from '../classes/states';

export interface VoteOptions extends CAOptions {
  ruleString: string;
}

const VoteDefaultOptions: Partial<VoteOptions> = {
  width: 64,
  height: 64,
  ruleString: '56789',
};

export const OSCILLATOR = `6b2ob$5b4o$5b4o$b2o3b2ob$7o$4o$b2o2b3ob$5b4o$5b4o$6b2ob`;

export class Vote extends CA {
  static readonly title = 'Vote';
  static readonly description =
    'Vote is an example of the simplest possible kind of eight-neighbor CA';
  static readonly options: Partial<VoteOptions>[] = [
    { title: 'Majority' },
    { title: 'Anneal', ruleString: '46789' },
    { title: 'Fredkin', ruleString: '13579' },
  ];
  static readonly patterns = [OSCILLATOR];
  static readonly className = 'vote';

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  protected vote: number[];

  constructor(options?: Partial<VoteOptions>) {
    options = {
      ...VoteDefaultOptions,
      ...options,
    };

    super(options);

    options.ruleString = options.ruleString.toUpperCase();
    const rule = parseRuleString(options.ruleString.toUpperCase());

    // TODO: M and V extension and range
    this.vote = rule.vote;
  }

  stateFunction(_: CellState, x: number, y: number) {
    const s = this.nineSum(x, y);
    return this.vote.indexOf(s) > -1 ? ACTIVE : EMPTY;
  }
}
