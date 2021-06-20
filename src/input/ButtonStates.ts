export default class ButtonStates<TButton> {
  private readonly pressedButtons: Set<TButton> = new Set();

  isPressed(button: TButton) {
    return this.pressedButtons.has(button);
  }

  setPressed(button: TButton, pressed: boolean) {
    if (pressed) {
      this.pressedButtons.add(button);
    } else {
      this.pressedButtons.delete(button);
    }
  }

  hasAnyButtonPressed() {
    return this.pressedButtons.size > 0;
  }
}