import { Action } from "../../screens/play/blockAction";
import { TGamepadButton } from "../tetrisGamepad";

export class TGamepadButtonBinding {
  button: TGamepadButton;
  action: Action;

  constructor(button: TGamepadButton, action: Action) {
    this.button = button;
    this.action = action;
  }
}

export function getDefaultBlockActionButtonBindings() {
  const ButtonBinding = TGamepadButtonBinding;
  return [
    new ButtonBinding(TGamepadButton.Up, Action.HardDrop),
    new ButtonBinding(TGamepadButton.Left, Action.Left),
    new ButtonBinding(TGamepadButton.Right, Action.Right),
    new ButtonBinding(TGamepadButton.Down, Action.Down),
    new ButtonBinding(TGamepadButton.Rotate, Action.Rotate),
    new ButtonBinding(TGamepadButton.Enter, Action.Enter),
  ];
}
