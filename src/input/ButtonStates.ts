export default class ButtonStates<TButton> {
  private readonly pressedButtons: Set<TButton> = new Set();
  private readonly pressedStartTimeMap: Map<TButton, number> = new Map();

  isPressed(button: TButton) {
    return this.pressedButtons.has(button);
  }

  setPressed(button: TButton, pressed: boolean) {
    if (pressed) {
      this.pressedStartTimeMap.set(button, new Date().getTime());
      this.pressedButtons.add(button);
    } else {
      this.pressedStartTimeMap.delete(button);
      this.pressedButtons.delete(button);
    }
  }

  hasAnyButtonPressed() {
    return this.pressedButtons.size > 0;
  }

  getPressDuration(btn: TButton) {
    return new Date().getTime() - this.pressedStartTimeMap.get(btn);
  }
}