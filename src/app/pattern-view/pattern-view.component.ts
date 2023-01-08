import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, OnInit, ViewEncapsulation } from '@angular/core';

import { CellState, Game, makeGridWith } from '../games/game';
import { readRle } from '../games/utils/rle';

const maxHeight = 100;
const maxWidth = 100;

@Component({
  selector: 'app-pattern-view',
  templateUrl: './pattern-view.component.html',
  styleUrls: ['./pattern-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class PatternViewComponent {
  @HostBinding('attr.title')
  @Input()
  pattern: string;

  @Input()
  states: CellState[];

  grid: CellState[][] = [];
  
  @HostBinding('style.--n')
  height: number = maxHeight;

  @HostBinding('style.--m')
  width: number = maxWidth;

  constructor(private readonly cdr: ChangeDetectorRef) {
  }

  ngOnChanges() {
    this.updateView();
  }

  trackByIndex(index: number): number {
    return index;
  }

  updateView() {
    if (!this.pattern) {
      this.height = maxHeight;
      this.width = maxWidth;
      this.grid = [];
    }

    setTimeout(() => {
      const { grid, height, width } = readRle(this.pattern);

      this.grid = [];

      for (let i = 0; i < Math.min(height, maxHeight); i++) {
        this.grid[i] ??= [];
        for (let j = 0; j < Math.min(width, maxWidth); j++) {
          if (grid?.[i]?.[j]) {
            this.grid[i][j] = this.tokenToState(grid[i][j]) as unknown as CellState;
          }
        }
      }

      this.height = height;
      this.width = width;

      this.cdr.markForCheck();
    }, 100);
  }

  tokenToState(token: string) {
    if (token === 'b') return this.states[this.states.length - 1];
    if (token === 'o') return this.states[0];

    return this.states.find((s) => s.token === token) || this.states[this.states.length - 1];
  }
}
