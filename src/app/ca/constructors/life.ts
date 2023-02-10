import { ACTIVE, EMPTY, CA, CAOptions, BoundaryType } from '../classes/base';
import parseRuleString from 'cellular-automata-rule-parser/formats/life';
import { CellState } from '../classes/states';

export interface LifeOptions extends CAOptions {
  ruleString: string;
}

const LifeDefaultOptions: Partial<LifeOptions> = {
  width: 64,
  ruleString: 'S23/B3'
};

export const Glider = 'bo$2bo$3o!';
export const GosperGliderGun =
  '24bo$22bobo$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o$2o8bo3bob2o4bobo$10bo5bo7bo$11bo3bo$12b2o!';
export const StillsAndOscillators =
  '2o7bo$2o7bo$9bo$$10bob$b2o5bo2bo$o2bo4bo2bo$b2o6bo$$$b2o5b2o$o2bo4bo$bobo7bo$2bo7b2o$$$$2o$obo$bo$$$bo7b3o$obo6bobo$bo7b3o$9b3o$9b3o$9b3o$9bobo$9b3o';
export const DieHard = '2o4bob$bo3b3o';

export class Life extends CA {
  static readonly title = 'Life';
  static readonly description = "Conway's Game of Life";
  static readonly options: Partial<LifeOptions>[] = [
    {
      title: "Conway's Life",
      ...LifeDefaultOptions,
      ruleString: 'S23/B3',
      boundaryType: BoundaryType.Infinite,
    },
    {
      title: 'Torus',
      ...LifeDefaultOptions,
      ruleString: 'S23/B3',
      boundaryType: BoundaryType.Torus,
    },
    { title: 'Diamoeba', ...LifeDefaultOptions, ruleString: 'S5678/B35678' },
    { title: 'Maze', ...LifeDefaultOptions, ruleString: 'S12345/B3' },
    { title: 'Day & Night', ...LifeDefaultOptions, ruleString: 'S34678/B3678' },
    { title: 'HighLife', ...LifeDefaultOptions, ruleString: 'S23/B36' },
    { title: 'Assimilation', ...LifeDefaultOptions, ruleString: 'S4567/B345' },
    { title: 'Coagulations', ...LifeDefaultOptions, ruleString: 'B378/S235678' },
    { title: 'Coral', ...LifeDefaultOptions, ruleString: 'S45678/B3' },
    { title: 'Replicator', ...LifeDefaultOptions, ruleString: 'B1357/S1357' },
    { title: 'Serviettes', ...LifeDefaultOptions, ruleString: 'B234/S' },
    { title: 'Walled Cities', ...LifeDefaultOptions, ruleString: 'B45678/S2345' },
    { title: 'AntiLife', ...LifeDefaultOptions, ruleString: 'B0123478/S01234678' }
  ];
  static readonly patterns = [Glider, StillsAndOscillators, GosperGliderGun];
  static readonly className = 'life';
  static readonly defaultOptions = LifeDefaultOptions;

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  protected birth: number[];
  protected survival: number[];

  constructor(options?: Partial<LifeOptions>) {
    options = {
      ...LifeDefaultOptions,
      ...options,
    };

    super(options);

    options.ruleString = options.ruleString.toUpperCase();

    if (options.ruleString.startsWith('B')) {
      const [B, S] = options.ruleString.split('/');
      options.ruleString = S + '/' + B;
    }

    const rule = parseRuleString(options.ruleString);

    this.birth = rule.birth;
    this.survival = rule.survival;
  }

  stateFunction(c: CellState, x: number, y: number) {
    const s = this.eightSum(x, y);
    if (c.state === EMPTY.state) {
      return this.birth.includes(s) ? ACTIVE : EMPTY;
    }
    return this.survival.includes(s) ? ACTIVE : EMPTY;
  }
}
