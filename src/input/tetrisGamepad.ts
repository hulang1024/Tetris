export enum TGamepadButton {
  Up,
  Right,
  Down,
  Left,
  Rotate,
  Enter
}

const BUTTON_CLASS_NAMES = ['up', 'right', 'down', 'left', 'rotate', 'enter'];
const BUTTONS = [
  TGamepadButton.Up,
  TGamepadButton.Right,
  TGamepadButton.Down,
  TGamepadButton.Left,
  TGamepadButton.Rotate,
  TGamepadButton.Enter
];

export default class TetrisGamepad {
  public readonly pressedStates: Map<TGamepadButton, boolean> = new Map();
  private readonly pressedStartTimeMap: Map<TGamepadButton, number> = new Map();
  onPress: (btn: TGamepadButton) => void;

  constructor({ onPress }: { onPress: (btn: TGamepadButton) => void }) {
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

  public isPressed(...btns: TGamepadButton[]) {
    return btns.every((b) => this.pressedStates.get(b));
  }

  public isPressedAny(...btns: TGamepadButton[]) {
    return btns.find((b) => this.pressedStates.get(b));
  }

  public getPressDuration(btn: TGamepadButton) {
    return new Date().getTime() - this.pressedStartTimeMap.get(btn);
  }
}