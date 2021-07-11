import { Action } from "../../screens/play/block_action";
import { InputKey } from "../keys";

class KeyBinding {
  key: InputKey;
  action: Action;

  constructor(key: InputKey, action: Action) {
    this.key = key;
    this.action = action;
  }
}

function getDefaultBlockActionKeyBindings() {
  return [
    new KeyBinding(InputKey.Up, Action.Up),
    new KeyBinding(InputKey.W, Action.Up),

    new KeyBinding(InputKey.Left, Action.Left),
    new KeyBinding(InputKey.A, Action.Left),

    new KeyBinding(InputKey.Right, Action.Right),
    new KeyBinding(InputKey.D, Action.Right),

    new KeyBinding(InputKey.Down, Action.Down),
    new KeyBinding(InputKey.S, Action.Down),

    new KeyBinding(InputKey.J, Action.Rotate),
    new KeyBinding(InputKey.Space, Action.HardDrop),

    new KeyBinding(InputKey.Enter, Action.Enter),
  ];
}

export class KeyBindingManager {
  private keyBindings: KeyBinding[];
  constructor() {
    this.keyBindings = getDefaultBlockActionKeyBindings();
  }

  getActionByKey(key: InputKey) {
    return this.keyBindings.find((binding) => binding.key == key)?.action ?? null;
  }
}
