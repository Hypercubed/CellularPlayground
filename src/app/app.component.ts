import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

import Stats from 'stats.js';

import { MatSelectChange } from '@angular/material/select';

import { Diodes, WireWorld } from './games/wireworld';
import { Ant } from './games/ant';
import { Life } from './games/life';
import { Wolfram } from './games/wolfram';
import { BoundaryType, CellState, Game, GameOptions } from './games/game';
import { KeyValue } from '@angular/common';
import { BB, bb2, bb3, bb4, bb5 } from './games/bb';
// import { Rain } from "./games/rain";
// import { City } from "./games/city";

/* Defining the interface for the pattern. */
interface GameListItem {
  title: string;
  Ctor: any;
  options?: any;
  patterns: string[];
  savedPatterns: Array<CellState[][]>;
  class?: string;
}

const Games: GameListItem[] = [
  {
    title: "Conway's Life",
    Ctor: Life,
    options: [
      {
        title: 'Default',
        ruleString: 'b3s23',
        boundaryType: BoundaryType.Infinite,
      },
      { title: 'Torus', ruleString: 'b3s23', boundaryType: BoundaryType.Torus },
      { title: 'Diamoeba', ruleString: 'B35678/S5678' },
      { title: 'Maze', ruleString: 'B3/S12345' },
    ],
    patterns: [''],
    savedPatterns: [],
    class: 'life',
  },
  {
    title: "Langton's Ant",
    Ctor: Ant,
    options: [
      { title: 'Default' },
      { title: 'Torus', boundaryType: BoundaryType.Torus },
    ],
    patterns: ['$$$$$$$$$$$$$$$$$$$18b▲'],
    savedPatterns: [],
    class: 'ant',
  },
  {
    title: 'WireWorld',
    Ctor: WireWorld,
    options: [],
    patterns: ['', Diodes],
    savedPatterns: [],
    class: 'wireworld',
  },
  {
    title: 'Wolfram Rules',
    Ctor: Wolfram,
    options: [
      { title: 'Rule 30', N: 30 },
      { title: 'Rule 90', N: 90 },
      { title: 'Rule 110', N: 110 },
    ],
    patterns: ['21bo'],
    savedPatterns: [],
    class: 'wolfram',
  },
  // {
  //   title: "Snow",
  //   Ctor: Rain,
  //   options: [
  //   ],
  //   patterns: [],
  //   savedPatterns: [],
  //   class: "snow",
  // },
  {
    title: 'Busy Beaver',
    Ctor: BB,
    options: [
      {
        title: '2-state busy beaver',
        BoundaryType: BoundaryType.Wall,
        rules: bb2,
      },
      {
        title: '3-state busy beaver',
        rules: bb3,
        BoundaryType: BoundaryType.Wall,
      },
      {
        title: '4-state busy beaver',
        height: 120,
        rules: bb4,
        BoundaryType: BoundaryType.Wall,
      },
      // { title: '5-state busy beaver', height: 240, width: 120, rules: bb5, BoundaryType: BoundaryType.Infinite },
    ],
    patterns: ['14bA'],
    savedPatterns: [],
    class: 'busybeaver',
  },
];

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly Games = Games;

  playing = false;
  paused = false;

  gameItem: GameListItem;
  game: Game;
  gameOptions: GameOptions;

  currentType: CellState;
  speed = -2;
  rle: string;

  private timeout = null;
  private stats: Stats;

  @ViewChild('board', { static: true }) board: ElementRef;
  @ViewChild('stats', { static: true }) statElement: ElementRef;

  constructor(private readonly cdr: ChangeDetectorRef) {
    this.stats = new Stats();
  }

  ngOnInit() {
    this.setupGame(this.Games[0], this.Games[0].options[0]);

    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.statElement.nativeElement.appendChild(this.stats.dom);
  }

  onGameChange(e: MatSelectChange) {
    this.stop();
    this.setupGame(e.value);
  }

  onOptionsChange(e: MatSelectChange) {
    this.stop();
    this.setupGame(this.gameItem, e.value);
  }

  onTogglePlay() {
    this.playing = !this.playing;
    if (this.playing && !this.timeout) {
      this.doStep();
    } else {
      this.stop();
    }
  }

  onReset() {
    this.resetGame();
  }

  onClear() {
    this.game.fillWith(this.game.emptyCell);
  }

  onRandom() {
    this.game.fillWith(() => {
      const i = Math.floor(Math.random() * this.game.states.length);
      return this.game.states[i];
    });
  }

  onMouseLeave() {
    if (this.playing && this.paused) {
      this.paused = false;
      this.doStep();
    }
  }

  onMouseEnter(e: MouseEvent, x: number, y: number) {
    if (e.buttons) {
      if (this.playing) {
        this.pause();
      }

      const s = e.buttons === 1 ? this.currentType : this.game.emptyCell;
      this.setCell(x, y, s);
    }
  }

  onClick(e: MouseEvent, x: number, y: number) {
    e.preventDefault();
    e.stopPropagation();

    this.setCell(x, y, this.currentType);
  }

  onTouch(e: TouchEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (this.playing) {
      this.pause();
    }

    const el = this.board.nativeElement;

    const dx = e.touches[0].clientX - el.offsetLeft;
    const dy = e.touches[0].clientY - el.offsetTop;

    const x = Math.floor((dx / el.clientWidth) * this.game.width);
    const y = Math.floor((dy / el.clientHeight) * this.game.height);

    this.setCell(x, y, this.currentType);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Space') {
      this.onTogglePlay();
    } else if (event.code === 'KeyS' && event.ctrlKey) {
      this.onAddPattern();
      event.preventDefault();
    }
  }

  setCell(x: number, y: number, s: CellState) {
    const c = this.game.getCell(x, y);
    if (c !== s) {
      this.game.immediatelySetCell(x, y, s);
      this.game.refreshStats();
    }
  }

  setupGame(
    gameItem: GameListItem,
    gameOptions: GameOptions = gameItem.options[0]
  ) {
    this.stop();

    this.gameItem = gameItem;
    this.resetGame(gameOptions);

    if (this.gameItem.patterns && !this.gameItem.savedPatterns.length) {
      this.gameItem.patterns.forEach((pattern: string) => {
        if (pattern) {
          this.gameItem.savedPatterns.push(this.game.rleToGrid(pattern));
        }
      });
    }
    this.currentType = this.game.defaultCell;
  }

  resetGame(gameOptions: GameOptions = this.gameItem.options[0]) {
    this.stop();

    this.gameOptions = gameOptions;
    const { Ctor } = this.gameItem;
    this.game = new Ctor(gameOptions);
    this.game.reset();

    if (this.gameItem.patterns && this.gameItem.patterns.length > 0) {
      const g = this.gameItem.patterns[0];
      const gg = this.game.rleToGrid(g);
      this.game.setGrid(gg);
    }
  }

  doStep() {
    this.timeout = null;

    if (this.speed > 0) {
      for (let i = 0; i < this.speed; i++) {
        this.stats.begin();
        this.game.doStep();
        this.stats.end();
      }
    } else {
      this.game.doStep();
    }
    this.game.refreshStats();
    this.cdr.detectChanges();

    if (this.playing && !this.paused) {
      const next = () => {
        this.doStep();
      };

      if (this.speed < 0) {
        const ms = Math.max(0, -this.speed * 100);
        this.timeout = setTimeout(next, ms);
      } else {
        requestAnimationFrame(next);
      }
    }
  }

  stop() {
    clearTimeout(this.timeout);
    this.timeout = null;
    this.playing = false;
  }

  pause() {
    clearTimeout(this.timeout);
    this.timeout = null;
    this.paused = true;
  }

  trackByMethod(index: number): number {
    return index;
  }

  titleAscOrder(
    a: KeyValue<string, GameListItem>,
    b: KeyValue<string, GameListItem>
  ): number {
    return a.value.title.localeCompare(b.value.title);
  }

  onAddPattern() {
    this.gameItem.savedPatterns.push(this.game.getGridClone());
    console.log(this.game.getRLE());
  }

  onUsePattern(g: CellState[][]) {
    this.game.setGrid(g);
  }

  onRemovePattern(pattern: CellState[][]) {
    this.gameItem.savedPatterns = this.gameItem.savedPatterns.filter(
      (p) => p !== pattern
    );
  }
}
