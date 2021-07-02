import { Replay, ReplayFrame } from "./replay";

export default class ReplayRecorder {
  private _replay: Replay;
  get replay() { return this._replay; }

  setReplay(replay: Replay) {
    this._replay = replay;
  }

  record(frame: ReplayFrame) {
    this.replay.frames.push(frame)
  }
}