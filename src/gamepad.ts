export enum GamepadButton {
  Up,
  Right,
  Down,
  Left,
  Rotate,
  Enter
}

const BUTTON_CLASS_NAMES = ['up', 'right', 'down', 'left', 'rotate', 'enter'];
const BUTTONS = [
  GamepadButton.Up,
  GamepadButton.Right,
  GamepadButton.Down,
  GamepadButton.Left,
  GamepadButton.Rotate,
  GamepadButton.Enter
];

const DAS = 16 * 16.666;
const dasButtons = [
  GamepadButton.Left, GamepadButton.Right, GamepadButton.Down
];

export default class Gamepad {
  public readonly pressedStates: Map<GamepadButton, boolean> = new Map();
  private readonly pressedStartTimeMap: Map<GamepadButton, number> = new Map();
  onPress: (btn: GamepadButton) => void;

  constructor({ onPress }: { onPress: (btn: GamepadButton) => void }) {
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

      btnEl.addEventListener('touchstart', function() {
        const btn = getGamepadButton(this);
        onPress(btn);
        pressedStates.set(btn, true);
        pressedStartTimeMap.set(btn, new Date().getTime());
        navigator.vibrate?.(20);
        return false;
      });

      const handleTouchOver = function() {
        const btn = getGamepadButton(this);
        pressedStates.set(btn, false);
        pressedStartTimeMap.set(btn, Infinity);
        return false;
      };
      btnEl.addEventListener('touchend', handleTouchOver);
      btnEl.addEventListener('touchcancel', handleTouchOver);
    });
  }

  public onUpdate() {
    dasButtons.forEach((btn) => {
      if (this.isPressed(btn) && this.getPressDuration(btn) > DAS) {
        this.onPress(btn);
      }
    });
  }

  public isPressed(...btns: GamepadButton[]) {
    return btns.every((b) => this.pressedStates.get(b));
  }

  public isPressedAny(...btns: GamepadButton[]) {
    return btns.find((b) => this.pressedStates.get(b));
  }

  public getPressDuration(btn: GamepadButton) {
    return new Date().getTime() - this.pressedStartTimeMap.get(btn);
  }
}