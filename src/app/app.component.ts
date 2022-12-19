import { Component, VERSION } from "@angular/core";
import { WireWorld } from "./games/wireworld";
import { Ant } from "./games/ant";
import { Life } from "./games/life";
import { Rule30 } from "./games/rule30";

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
    Rule30
  };

  private timeout = null;
  private speed = 100;

  ngOnInit() {
    this.game.reset();
  }

  onGameChange(e: Event) {
    this.stop();

    const key = (e.target as HTMLSelectElement).value;
    this.game = new this.Games[key]();
    this.game.reset();
    this.currentType = this.game.states[0];
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

  stop() {
    clearTimeout(this.timeout);
    this.timeout = null;
    this.playing = false;
  }
}
