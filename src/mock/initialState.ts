import { SDUIState } from '../types/sdui';
import { sduiEngine } from '../services/sduiEngine';

export const INITIAL_SDUI_STATE: SDUIState = sduiEngine.getDeclarativeState();
