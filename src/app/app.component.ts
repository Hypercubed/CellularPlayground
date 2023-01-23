import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { KeyValue } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import type { MatSelectChange } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';

import Stats from 'stats.js';

import { CAListItem, CAList } from './ca/list';
import { OCA } from './ca/classes/elementary';
import { BoundaryType, CA, CAOptions } from './ca/classes/base';

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
  height = 0;
  width = 0;
  dx = 0;
  dy = 0;

  private timeoutId = null;
  private requestId = null;
  private stats: Stats;

  @ViewChild('board', { static: true }) board: ElementRef;
  @ViewChild('stats', { static: true }) statElement: ElementRef;
  @ViewChild('helpDialog', { static: true }) helpDialog: TemplateRef<any>;

  timeoutMs: number;
  frameSkip: number;

  constructor(
    private readonly clipboard: Clipboard,
    private readonly cdr: ChangeDetectorRef,
    public readonly dialog: MatDialog
  ) {
    this.stats = new Stats();
  }

  ngOnInit() {
    this.loadStateFromStore();
    this.caItem ??= this.CAList[0];
    this.caOptions ??= this.caItem.options[0];

    this.setupCA(this.caItem, this.caOptions);

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
    this.dx = 0;
    this.dy = 0;
    this.ca.refreshStats();
  }

  onRandom() {
    if (this.ca instanceof OCA) {
      this.ca.fillWith((_, y) => {
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

    this.ca.set(x + dx, y + dy, this.currentType);
    this.ca.refreshStats();
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Control Keys
    if (event.ctrlKey) {
      if (event.code === 'KeyS' && event.ctrlKey) {
        this.onAddPattern();
        event.preventDefault();
      } else if (event.code === 'KeyC' && event.ctrlKey) {
        const pattern = this.ca.getRLE();
        this.clipboard.copy(pattern);
        event.preventDefault();
      } else if (event.code === 'KeyV' && event.ctrlKey) {
        navigator['clipboard'].readText().then((data) => {
          this.loadPattern(data);
        });
        event.preventDefault();
      }
      // Normal Keys
    } else {
      if (event.key === '?') {
        this.showHelp();
        return;
      }

      switch (event.code) {
        case 'Space':
          this.onTogglePlay();
          return;
        case 'KeyR':
          this.onReset();
          return;
        case 'Delete':
          this.onClear();
          return;
        case 'KeyZ':
          this.onRandom();
          return;
        case 'KeyN':
          this.play();
          return;
        case 'KeyC':
          this.center();
          return;
        case 'KeyF':
          this.centerChange();
          return;
        case 'Home':
          this.dx = this.dy = 0;
          return;
        case 'KeyD':
          this.pan(-1, 0);
          return;
        case 'KeyA':
          this.pan(1, 0);
          return;
        case 'KeyW':
          this.pan(0, 1);
          return;
        case 'KeyS':
          this.pan(0, -1);
          return;
        case 'PageUp': {
          this.zoom(0.75);
          return;
        }
        case 'PageDown': {
          this.zoom(1.25);
          return;
        }
      }
    }
    // console.log(event);
  }

  makeGrid(height: number, width: number) {
    this.height = height;
    this.width = width;
  }

  zoom(s: number) {
    if (this.ca.boundaryType !== BoundaryType.Infinite) return;

    const { width, height } = this;

    // TODO: zoom in center
    this.height = Math.floor(height * s);
    this.width = Math.floor(width * s);

    this.dx += Math.ceil((width - this.width) / 2);
    this.dy += Math.ceil((height - this.height) / 2);

    return;
  }

  center() {
    if (this.ca.boundaryType !== BoundaryType.Infinite) return;

    const [top, right, bottom, left] = this.ca.getBoundingBox();

    const cx = Math.floor((right + left) / 2);
    const cy = Math.floor((bottom + top) / 2);

    const vx = Math.floor(this.width / 2);
    const vy = Math.floor(this.height / 2);

    this.dx = cx - vx;
    this.dy = cy - vy;
  }

  centerChange() {
    if (this.ca.boundaryType !== BoundaryType.Infinite) return;

    const [top, right, bottom, left] = this.ca.getChangeBoundingBox();

    const cx = Math.floor((right + left) / 2);
    const cy = Math.floor((bottom + top) / 2);

    const vx = Math.floor(this.ca.width / 2);
    const vy = Math.floor(this.ca.height / 2);

    this.dx = cx - vx;
    this.dy = cy - vy;
  }

  pan(dx: number, dy: number) {
    if (this.ca.boundaryType !== BoundaryType.Infinite) return;
    this.dx += dx;
    this.dy += dy;
  }

  showHelp() {
    this.dialog.open(this.helpDialog, {
      minWidth: '50vw',
      minHeight: '50vh',
    });
  }

  setupCA(caItem: CAListItem, caOptions?: CAOptions) {
    this.stop();

    this.caItem = caItem;
    caOptions ??= caItem.options?.[0];
    this.resetCA(caOptions);
    this.currentType = this.ca.defaultCell;
    this.loadPatternsFromStore();
    this.saveStateToStore();
  }

  resetCA(caOptions: CAOptions) {
    this.stop();

    this.caOptions = caOptions;
    const { Ctor } = this.caItem;
    this.ca = new Ctor(caOptions || {});
    this.ca.reset();

    this.makeGrid(this.ca.height, this.ca.width);
    this.dx = 0;
    this.dy = 0;
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
    this.dx = 0;
    this.dy = 0;
    this.ca.refreshStats();

    this.cdr.markForCheck();
  }

  onRightClick(event: Event, pattern: string) {
    event.preventDefault();
    console.log(pattern);
    this.clipboard.copy(pattern);
    return false;
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
      }
    }
  }

  private saveStateToStore() {
    const ruleIndex = this.CAList.findIndex((c) => c === this.caItem);
    const optionIndex = this.caItem.options.findIndex(
      (c: CAOptions) => c === this.caOptions
    );

    localStorage.setItem(`rule`, `${ruleIndex}-${optionIndex}`);
  }

  private loadStateFromStore() {
    const rule = localStorage.getItem(`rule`);
    if (!rule) return;

    const [ruleIndex, optionIndex] = rule
      .split('-')
      .map((i) => parseInt(i, 10));

    this.caItem = this.CAList[ruleIndex] || this.CAList[0];
    this.caOptions = this.caItem.options[optionIndex] || this.caItem.options[0];
  }
}
