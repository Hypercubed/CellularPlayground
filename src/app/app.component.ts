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

import { CAListItem, CAList } from './ca/list';
import { OCA } from './ca/classes/elementary';
import { CA, CAOptions } from './ca/classes/base';
import { makeGridWith } from './ca/utils/grid';

import type { MatSelectChange } from '@angular/material/select';
import type { CellState } from './ca/classes/states';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly CAList = CAList;

  playing = false;
  paused = false;

  caItem: CAListItem;
  ca: CA;
  caOptions: CAOptions;

  currentType: CellState;
  speed = -2;
  rle: string;

  // This is an array of empty cells... used to draw the grid
  grid: Readonly<CellState[][]>;

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
    this.setupCA(this.CAList[0], this.CAList[0]?.options[0]);

    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.statElement.nativeElement.appendChild(this.stats.dom);
  }

  onGameChange(e: MatSelectChange) {
    this.stop();
    this.setupCA(e.value);
    this.loadPatternsFromStore();
  }

  onOptionsChange(e: MatSelectChange) {
    this.stop();
    this.setupCA(this.caItem, e.value);
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
    this.resetCA(this.caOptions);
  }

  onClear() {
    this.ca.clearGrid();
    this.ca.refreshStats();
  }

  onRandom() {
    if (this.ca instanceof OCA) {
      this.ca.fillWith((x, y) => {
        if (y !== this.ca.step) return this.ca.emptyCell;
        return Math.random() < 0.5 ? this.ca.defaultCell : this.ca.emptyCell;
      });
    } else {
      this.ca.fillWith(() => {
        const i = Math.floor(Math.random() * this.ca.states.length);
        return this.ca.states[i];
      });
    }
    this.ca.refreshStats();
  }

  onMouseLeave() {
    this.ca.refreshStats();
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

      const s = e.buttons === 1 ? this.currentType : this.ca.emptyCell;
      this.ca.set(x, y, s);
    }
  }

  onClick(e: MouseEvent, x: number, y: number) {
    e.preventDefault();
    e.stopPropagation();

    this.ca.set(x, y, this.currentType);
    this.ca.refreshStats();
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

    const x = Math.floor((dx / el.clientWidth) * this.ca.width);
    const y = Math.floor((dy / el.clientHeight) * this.ca.height);

    this.ca.set(x, y, this.currentType);
    this.ca.refreshStats();
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

  setupCA(caItem: CAListItem, caOptions?: CAOptions) {
    this.stop();

    this.caItem = caItem;
    caOptions ??= caItem.options?.[0];
    this.resetCA(caOptions);
    this.currentType = this.ca.defaultCell;
    this.loadPatternsFromStore();
  }

  resetCA(caOptions: CAOptions) {
    this.stop();

    this.caOptions = caOptions;
    const { Ctor } = this.caItem;
    this.ca = new Ctor(caOptions || {});
    this.ca.reset();

    this.grid = makeGridWith(this.ca.width, this.ca.height, this.ca.emptyCell);
    if (this.caItem.startingPattern) {
      this.loadPattern(this.caItem.startingPattern);
    }
    this.ca.refreshStats();
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
    this.ca.refreshStats();
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
      this.ca.doStep();
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

  trackByIndex(index: number): number {
    return index;
  }

  titleAscOrder(
    a: KeyValue<string, CAListItem>,
    b: KeyValue<string, CAListItem>
  ): number {
    return a.value.title.localeCompare(b.value.title);
  }

  onAddPattern() {
    const pattern = this.ca.getRLE();
    this.caItem.savedPatterns.push(pattern);
    this.savePatternsToStore();
  }

  onRemovePattern(pattern: string) {
    this.caItem.savedPatterns = this.caItem.savedPatterns.filter(
      (p) => p !== pattern
    );
    this.savePatternsToStore();
  }

  loadPattern(pattern: string) {
    this.ca.loadRLE(pattern);
    this.ca.refreshStats();
  }

  private savePatternsToStore() {
    localStorage.setItem(
      `patterns-${this.caItem.class}`,
      JSON.stringify(this.caItem.savedPatterns)
    );
  }

  private loadPatternsFromStore() {
    const patterns = localStorage.getItem(`patterns-${this.caItem.class}`);
    if (patterns) {
      try {
        this.caItem.savedPatterns = JSON.parse(patterns);
      } catch (e) {
        this.caItem.savedPatterns = [];
        console.log(e);
      }
    }
  }
}
