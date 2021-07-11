import { DAS } from "./delay";

export enum TetrisGamepadButton {
  Up,
  Right,
  Down,
  Left,
  Rotate,
  Enter
}

const BUTTON_CLASS_NAMES = ['up', 'right', 'down', 'left', 'rotate', 'enter'];
const BUTTONS = [
  TetrisGamepadButton.Up,
  TetrisGamepadButton.Right,
  TetrisGamepadButton.Down,
  TetrisGamepadButton.Left,
  TetrisGamepadButton.Rotate,
  TetrisGamepadButton.Enter
];

export default class TetrisGamepad {
  public readonly pressedStates: Map<TetrisGamepadButton, boolean> = new Map();
  private readonly pressedStartTimeMap: Map<TetrisGamepadButton, number> = new Map();
  onPress: (btn: TetrisGamepadButton) => void;

  constructor({ onPress }: { onPress: (btn: TetrisGamepadButton) => void }) {
    this.onPress = onPress;
    const el = document.querySelector('.gamepad') as HTMLElement;
    el.style.display = 'flex';

    const getGamepadButton = (btn: Element) => {
      let index = BUTTON_CLASS_NAMES.findIndex((c) => btn.classList.contains(c));
      if (index > -1) {
        return BUTTONS[index];
      }
    };

    const { pressedStates, pressedStartTimeMap } = this;

    el.querySelectorAll('.btn').forEach((btnEl) => {
      btnEl.addEventListener('contextmenu', function(event: Event) {
        event.preventDefault();
        return false;
      });

      const handleTouchStart = function() {
        const btn = getGamepadButton(this);
        onPress(btn);
        pressedStates.set(btn, true);
        pressedStartTimeMap.set(btn, new Date().getTime());
        return false;
      };
      btnEl.addEventListener('touchstart', handleTouchStart);

      const handleTouchEnd = function() {
        const btn = getGamepadButton(this);
        pressedStates.set(btn, false);
        pressedStartTimeMap.set(btn, Infinity);
        return false;
      };
      btnEl.addEventListener('touchend', handleTouchEnd);
      btnEl.addEventListener('touchcancel', handleTouchEnd);
    });
  }

  public onUpdate() {
    BUTTONS.forEach((btn) => {
      if (this.isPressed(btn) && this.getPressDuration(btn) > DAS) {
        this.onPress(btn);
      }
    });
  }

  public isPressed(...btns: TetrisGamepadButton[]) {
    return btns.every((b) => this.pressedStates.get(b));
  }

  public isPressedAny(...btns: TetrisGamepadButton[]) {
    return btns.find((b) => this.pressedStates.get(b));
  }

  public getPressDuration(btn: TetrisGamepadButton) {
    return new Date().getTime() - this.pressedStartTimeMap.get(btn);
  }
}