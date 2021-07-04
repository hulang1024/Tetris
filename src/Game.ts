
import { Action } from "./action";
import KeyboardHandler from "./input/KeyboardHandler";
import KeyboardState from "./input/KeyboardState";
import { InputKey } from "./input/keys";
import Gamepad, { GamepadButton } from "./input/gamepad";
import { DAS } from "./input/delay";

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
            action = Action.Up;
            break;
          case GamepadButton.Rotate:
            action = Action.Rotate;
            break;
          case GamepadButton.Down:
            action = Action.Down;
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
    const keyboardOnUpdate = this.keyboardOnUpdate.bind(this);
    const gamepadOnUpdate = this.gamepad ? this.gamepad.onUpdate.bind(this.gamepad) : null;
    let lastTime = 0;
    function update(time: number) {
      const dt = (time - (lastTime == 0 ? time : lastTime)) / 1000;
      onUpdate(dt);
      gamepadOnUpdate?.();
      keyboardOnUpdate();
      lastTime = time;
      requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  gameKeyboardInputKeys = [
    InputKey.Up, InputKey.W, InputKey.J,
    InputKey.Down, InputKey.S,
    InputKey.Right, InputKey.D,
    InputKey.Left, InputKey.A,
  ];

  keyboardOnUpdate() {
    this.gameKeyboardInputKeys.forEach((key) => {
      if (this.keyboardState.keys.isPressed(key)
        && this.keyboardState.keys.getPressDuration(key) > DAS) {
        this.onInputKey(key);
      }
    });
  }

  protected abstract onUpdate(dt: number): void;

  protected onKeyUp(key: InputKey, event?: KeyboardEvent) {}
  protected onKeyDown(key: InputKey, event?: KeyboardEvent) {
    if (event.repeat) {
      return;
    }
    this.onInputKey(key);
  }

  protected onAction(action: Action) {}

  private onInputKey(key: InputKey) {
    let action = null;
    switch (key) {
      case InputKey.Up:
      case InputKey.W:
        action = Action.Up;
        break;
      case InputKey.J:
        action = Action.Rotate;
        break;
      case InputKey.Down:
      case InputKey.S:
        action = Action.Down;
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
}