import Bindable from "../utils/bindables/Bindable";

const clearLineToScoreTable: Record<number, number> = {
  1: 40,
  2: 100,
  3: 300,
  4: 1200
}

export class ScoreProcessor {
  score = new Bindable<number>(0);
  lines = new Bindable<number>(0);

  onBottom() {
    this.score.value += 5;
  }

  onClearLines(lines: number) {
    this.lines.value += lines;
    this.score.value += clearLineToScoreTable[lines];
  }

  reset() {
    this.score.value = 0;
    this.lines.value = 0;
  }
}