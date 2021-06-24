import KeyboardHandler from "./input/KeyboardHandler";
import KeyboardState from "./input/KeyboardState";
import { InputKey } from "./input/keys";

export abstract class Game {
  keyboardState: KeyboardState = new KeyboardState();

  constructor() {
    new KeyboardHandler({
      onKeyDown: (key, event) => {
        this.onKeyDown(key, event);
        if (!event.repeat) {
          this.keyboardState.keys.setPressed(key, true);
        }
      },
      onKeyUp: (key, event) => {
        this.onKeyUp(key, event);
        if (!event.repeat) {
          this.keyboardState.keys.setPressed(key, false);
        }
      },
    });

    this.setupUpdateLoop();
  }

  private setupUpdateLoop() {
    const onUpdate = this.onUpdate.bind(this);
    let lastTime = 0;
    function update(time: number) {
      const dt = (time - (lastTime == 0 ? time : lastTime)) / 1000;
      onUpdate(dt);
      lastTime = time;
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  protected abstract onUpdate(dt: number): void;

  protected onKeyUp(key: InputKey, event?: KeyboardEvent) {}
  protected onKeyDown(key: InputKey, event?: KeyboardEvent) {}
}