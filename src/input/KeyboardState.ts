import ButtonStates from './ButtonStates';
import { InputKey } from './keys';

export default class KeyboardState {
  public readonly keys: ButtonStates<InputKey> = new ButtonStates();  
}