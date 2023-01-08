import parseRuleString from 'cellular-automata-rule-parser/formats/wolfram';
import {
  ACTIVE,
  BoundaryType,
  CellState,
  EMPTY,
  Game,
  GameOptions,
} from '../game';

const defaultWolframOptions = {
  oneDimensional: true,
  width: 43,
  height: 22,
  boundaryType: BoundaryType.Infinite,
  ruleNumber: 30
};

interface WolframOptions extends GameOptions {
  ruleNumber: number;
}

export class Wolfram extends Game<CellState, WolframOptions> {
  width = 86 / 2;
  height = 86 / 2;

  states = [ACTIVE, EMPTY];
  pallet = [[ACTIVE, EMPTY]];

  private ruleNumber: number;

  constructor(options?: Partial<WolframOptions>) {
    super({
      ...defaultWolframOptions,
      ...options,
    });

    this.ruleNumber = this.options.ruleNumber;
  }

  getNextCell(x: number, y: number) {
    const b0 = +(this.get(x + 1, y - 1)?.state === ACTIVE.state);
    const b1 = +(this.get(x, y - 1)?.state === ACTIVE.state);
    const b2 = +(this.get(x - 1, y - 1)?.state === ACTIVE.state);
    return (this.ruleNumber & 2**(b0*4 + b1*2 + b2) ? ACTIVE : EMPTY);
  }
}
