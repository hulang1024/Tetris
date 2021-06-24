import { InputKey } from "./keys";

interface KeyboardHandle {
  (key: InputKey, event?: KeyboardEvent): void;
}

export default class KeyboardHandler {
  constructor({ onKeyDown, onKeyUp }: { onKeyDown: KeyboardHandle, onKeyUp: KeyboardHandle }) {
    window.addEventListener('keydown', (event: KeyboardEvent) => {
      onKeyDown(this.inputKeyFromKeyboardEvent(event), event);
    });
    window.addEventListener('keyup', (event: KeyboardEvent) => {
      onKeyUp(this.inputKeyFromKeyboardEvent(event), event);
    });
  }

  private inputKeyFromKeyboardEvent(event: KeyboardEvent): InputKey {
    if (event.key !== undefined) {
      if (event.key.length == 1) {
        const keyCharCode = event.key.toUpperCase().charCodeAt(0);
        if (65 <= keyCharCode && keyCharCode <= 90) {
          return (InputKey.A + (keyCharCode - 65)) as InputKey;
        }
      }
      switch (event.key) {
        case ' ':
          return InputKey.Space;
        case 'Shift':
          return InputKey.Shift;
        case 'Enter':
          return InputKey.Enter;
        case 'ArrowLeft':
          return InputKey.Left;
        case 'ArrowUp':
          return InputKey.Up;
        case 'ArrowRight':
          return InputKey.Right;
        case 'ArrowDown':
          return InputKey.Down;
      }
    } else if (event.keyCode !== undefined) {
      if (65 <= event.keyCode && event.keyCode <= 90) {
        return (InputKey.A + (event.keyCode - 65)) as InputKey;
      }
      switch (event.keyCode) {
        case 32:
          return InputKey.Space;
        case 16:
          return InputKey.Shift;
        case 14:
          return InputKey.Enter;
        case 37:
          return InputKey.Left;
        case 38:
          return InputKey.Up;
        case 39:
          return InputKey.Right;
        case 40:
          return InputKey.Down;
      }
    }
  
    return null;
  }
}