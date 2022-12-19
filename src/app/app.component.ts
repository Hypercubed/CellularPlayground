import { Component, VERSION } from "@angular/core";
// import { City } from './games/city';
import { WireWorld } from "./games/wireworld";
import { Ant } from "./games/ant";
import { Life } from "./games/life";

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent {
  game = new Life();
  currentType = this.game.states[0];
  playing = false;

  readonly Games = {
    "Conway's Life": Life,
    "Langton's Ant": Ant,
    WireWorld,
  };

  private timeout = null;
  private speed = 100;

  ngOnInit() {
    this.game.reset();
  }

  onGameChange(e: Event) {
    const key = (e.target as HTMLSelectElement).value;
    this.game = new this.Games[key]();
    this.game.reset();
    this.currentType = this.game.states[0];
  }

  onTooglePlay() {
    this.playing = !this.playing;
    if (this.playing && !this.timeout) {
      this.doStep();
    }
  }

  onReset() {
    this.game.reset();
  }

  onRandom() {
    this.game.grid = Array.from({ length: this.game.size }, () =>
      Array.from({ length: this.game.size }).map((_) => this.game.randomState())
    );
  }

  onMouseEnter(e: MouseEvent, j: number, i: number) {
    if (e.buttons) {
      this.game.setCell(j, i, this.currentType);
      this.game.doStats();
    }
  }

  doStep() {
    this.timeout = null;
    this.game.doStep();
    this.game.doStats();

    if (this.playing) {
      this.timeout = setTimeout(() => {
        this.doStep();
      }, this.speed);
    }
  }
}

function matrix(length: number, n: number, v: string) {
  return Array.from({ length }, () => new Array(n).fill(v));
}
