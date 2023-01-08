import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { KeyValue } from '@angular/common';

import Stats from 'stats.js';

import { GameListItem, Games } from './games/games';

import type { MatSelectChange } from '@angular/material/select';
import { CellState, Game, GameOptions, makeGridWith } from './games/game';

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
  grid: CellState[][];

  private timeoutId = null;
  private requestId = null;
  private stats: Stats;

  @ViewChild('board', { static: true }) board: ElementRef;
  @ViewChild('stats', { static: true }) statElement: ElementRef;
  timeoutMs: number;
  frameSkip: number;

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
    this.loadPatternsFromStore();
  }

  onOptionsChange(e: MatSelectChange) {
    this.stop();
    this.setupGame(this.gameItem, e.value);
  }

  onTogglePlay() {
    this.playing = !this.playing;
    if (this.playing) {
      this.play();
    } else {
      this.stop();
    }
  }

  onReset() {
    this.resetGame();
  }

  onClear() {
    this.game.clearGrid();
    this.updateView();
  }

  onRandom() {
    if (this.game.oneDimensional) {
      this.game.fillWith((x, y) => {
        if (y !== this.game.step) return this.game.emptyCell;
        return Math.random() < 0.5 ? this.game.defaultCell : this.game.emptyCell;
      });
    } else {
      this.game.fillWith(() => {
        const i = Math.floor(Math.random() * this.game.states.length);
        return this.game.states[i];
      });
    }
    this.updateView();
  }

  onMouseLeave() {
    this.updateView();
    if (this.playing && this.paused) {
      this.paused = false;
      this.play();
    }
  }

  onMouseEnter(e: MouseEvent, x: number, y: number) {
    if (e.buttons) {
      if (this.playing) {
        this.pause();
      }

      const s = e.buttons === 1 ? this.currentType : this.game.emptyCell;
      this.game.set(x, y, s);
      this.grid[y][x] = s;
    }
  }

  onClick(e: MouseEvent, x: number, y: number) {
    e.preventDefault();
    e.stopPropagation();

    this.game.set(x, y, this.currentType);
    this.game.refreshStats();
    this.updateView();
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

    this.game.set(x, y, this.currentType);
    this.updateView();
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

  setupGame(
    gameItem: GameListItem,
    gameOptions: GameOptions = gameItem.options[0]
  ) {
    this.stop();

    this.gameItem = gameItem;
    this.resetGame(gameOptions);
    this.currentType = this.game.defaultCell;
  }

  resetGame(gameOptions: GameOptions = this.gameOptions || this.gameItem.options[0]) {
    this.stop();

    this.gameOptions = gameOptions;
    const { Ctor } = this.gameItem;
    this.game = new Ctor(gameOptions);
    this.game.reset();

    this.grid = makeGridWith(
      this.game.width,
      this.game.height,
      this.game.emptyCell
    );
    if (this.gameItem.startingPattern) {
      this.loadPattern(this.gameItem.startingPattern);
    }
    this.updateView();
  }

  play() {
    clearTimeout(this.timeoutId);
    cancelAnimationFrame(this.requestId);

    this.timeoutMs = Math.max(0, Math.abs(this.speed) * 150);
    this.frameSkip = Math.min(Math.max(1, 4 ** this.speed), 1000);
    
    this.runSimulationLoop();
    this.runAnimationLoop();
  }

  private runAnimationLoop() {
    this.updateView();
    this.cdr.markForCheck();

    this.timeoutId = setTimeout(() => {
      if (this.playing && !this.paused) {
        this.play();
      }
    }, this.timeoutMs);
  }

  private runSimulationLoop() {
    for (let i = 0; i < this.frameSkip; i++) {
      this.stats.begin();
      this.game.doStep();
      this.stats.end();
    }

    this.requestId = requestAnimationFrame(() => {
      if (this.playing && !this.paused && this.speed > 0) {
        this.runSimulationLoop();
      }
    });
  }

  stop() {
    this.playing = false;
    clearTimeout(this.timeoutId);
    cancelAnimationFrame(this.requestId);
    this.timeoutId = null;
    this.requestId = null;
  }

  pause() {
    this.paused = true;
    clearTimeout(this.timeoutId);
    cancelAnimationFrame(this.requestId);
    this.timeoutId = null;
    this.requestId = null;
  }

  updateView() {
    this.game.updateViewGrid(
      this.grid,
      0,
      this.game.width,
      this.game.height,
      0
    );
    this.game.refreshStats();
  }

  trackByIndex(index: number): number {
    return index;
  }

  titleAscOrder(
    a: KeyValue<string, GameListItem>,
    b: KeyValue<string, GameListItem>
  ): number {
    return a.value.title.localeCompare(b.value.title);
  }

  onAddPattern() {
    const pattern = this.game.getRLE();
    this.gameItem.savedPatterns.push(pattern);
    this.savePatternsToStore();
  }

  onRemovePattern(pattern: string) {
    this.gameItem.savedPatterns = this.gameItem.savedPatterns.filter(
      (p) => p !== pattern
    );
    this.savePatternsToStore();
  }

  loadPattern(pattern: string) {
    this.game.loadRLE(pattern);
    this.updateView();
  }

  private savePatternsToStore() {
    localStorage.setItem(
      `patterns-${this.gameItem.class}`,
      JSON.stringify(this.gameItem.savedPatterns)
    );
  }

  private loadPatternsFromStore() {
    const patterns = localStorage.getItem(`patterns-${this.gameItem.class}`);
    if (patterns) {
      try {
        this.gameItem.savedPatterns = JSON.parse(patterns);
      } catch (e) {
        this.gameItem.savedPatterns = [];
        console.log(e);
      }
    }
  }
}
