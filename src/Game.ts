
import { Action } from "./action";
import KeyboardHandler from "./input/KeyboardHandler";
import KeyboardState from "./input/KeyboardState";
import { InputKey } from "./input/keys";
import Gamepad, { GamepadButton } from "./gamepad";

export abstract class Game {
  keyboardState: KeyboardState = new KeyboardState();
  gamepad: Gamepad;

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

    this.gamepad = !window.device.mobile() ? null : new Gamepad({
      onPress: (button) => {
        let action = null;
        switch (button) {
          case GamepadButton.Up:
            action = Action.Down;
            break;
          case GamepadButton.Rotate:
            action = Action.Rotate;
            break;
          case GamepadButton.Down:
            action = Action.HardDrop;
            break;
          case GamepadButton.Right:
            action = Action.Right;
            break;
          case GamepadButton.Left:
            action = Action.Left;
            break;
          case GamepadButton.Enter:
            action = Action.Enter;
            break;
        }
        if (action) {
          this.onAction(action);
        }
      }
    });

    this.setupUpdateLoop();
  }

  private setupUpdateLoop() {
    const onUpdate = this.onUpdate.bind(this);
    const gamepadOnUpdate = this.gamepad ? this.gamepad.onUpdate.bind(this.gamepad) : null;
    let lastTime = 0;
    function update(time: number) {
      const dt = (time - (lastTime == 0 ? time : lastTime)) / 1000;
      onUpdate(dt);
      gamepadOnUpdate?.();
      lastTime = time;
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  protected abstract onUpdate(dt: number): void;

  protected onKeyUp(key: InputKey, event?: KeyboardEvent) {}
  protected onKeyDown(key: InputKey, event?: KeyboardEvent) {
    let action = null;
    switch (key) {
      case InputKey.Up:
      case InputKey.W:
      case InputKey.J:
        action = Action.Rotate;
        break;
      case InputKey.Down:
      case InputKey.S:
        action = Action.HardDrop;
        break;
      case InputKey.Right:
      case InputKey.D:
        action = Action.Right;
        break;
      case InputKey.Left:
      case InputKey.A:
        action = Action.Left;
        break;
      case InputKey.Enter:
        action = Action.Enter;
        break;
      case InputKey.Space:
        action = Action.HardDrop;
        break;
    }
    if (action) {
      this.onAction(action)
    }
  }

  protected onAction(action: Action) {}
}