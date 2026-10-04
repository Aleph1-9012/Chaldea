import Ajv from 'ajv';
import hostSchema from '../../../schemas/preview-host.schema.json';

interface BaseControl { key: string; label: string; hidden: boolean; disabled: boolean }

export type InteractionControl = BaseControl & (
  | { type: 'button'; pressed?: boolean }
  | { type: 'range'; value: number; min: number; max: number; step: number; output?: string; quality?: number }
  | { type: 'select'; value: string; options: { value: string; label: string }[] }
  | { type: 'text'; value: string; maxLength: number; placeholder?: string }
);

export interface InteractionState {
  controls: InteractionControl[];
  archives: { key: string; label: string }[];
  status: string;
  paused: boolean;
  canEscape?: boolean;
}

export type InteractionValue = string | number | boolean;

type Action = { channel: 'chaldea:preview'; type: 'action'; token: string; key: string; sequence: number } & (
  | { kind: 'button' | 'archive' | 'escape'; value?: never }
  | { kind: 'pause'; value: boolean }
  | { kind: 'range'; value: number }
  | { kind: 'select' | 'text'; value: string }
);

export interface InteractionView {
  update(state: InteractionState, ack: number): void;
  focus(key: string): void;
  error(message: string): void;
  unavailable(message?: string): void;
}

export const checkAction = new Ajv({ strict: false, strictNumbers: true }).addSchema(hostSchema).compile<Action>({ $ref: 'chaldea-preview-host-v1#/definitions/action' });

export function interactionKind(state: InteractionState, key: string): Action['kind'] | undefined {
  if (key === 'preview:pause') return 'pause';
  if (key === 'preview:escape') return state.canEscape ? 'escape' : undefined;
  if (state.archives.some(item => item.key === key)) return 'archive';

  const control = state.controls.find(item => item.key === key);

  return control && !control.hidden && !control.disabled ? control.type : undefined;
}

export function validInteractionState(state: InteractionState): boolean {
  const keys = new Set<string>(['preview:pause', 'preview:escape']);

  for (const control of state.controls) {
    if (keys.has(control.key)) return false;
    if (control.type === 'range' && (control.min > control.max || control.value < control.min || control.value > control.max)) return false;
    if (control.type === 'select' && (new Set(control.options.map(option => option.value)).size !== control.options.length || !control.options.some(option => option.value === control.value))) return false;
    if (control.type === 'text' && [...control.value].length > control.maxLength) return false;

    keys.add(control.key);
  }

  for (const item of state.archives) {
    if (keys.has(item.key)) return false;

    keys.add(item.key);
  }

  return true;
}
