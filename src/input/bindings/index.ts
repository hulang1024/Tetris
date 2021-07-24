import { InputKey } from "../keys";
import { TGamepadButton } from "../tetrisGamepad";
import { getDefaultBlockActionKeyBindings, KeyBinding } from "./keyBindings";
import { getDefaultBlockActionButtonBindings, TGamepadButtonBinding } from "./tGamepadButtonBindings";

export class InputBindingManager {
  private keyBindings: KeyBinding[];
  private tButtonBindings: TGamepadButtonBinding[];
  
  constructor() {
    this.keyBindings = getDefaultBlockActionKeyBindings();
    this.tButtonBindings = getDefaultBlockActionButtonBindings();
  }

  getActionByKey(key: InputKey) {
    return this.keyBindings.find((binding) => binding.key == key)?.action ?? null;
  }

  getActionByTGamepadButton(button: TGamepadButton) {
    return this.tButtonBindings.find((binding) => binding.button == button)?.action ?? null;
  }
}
