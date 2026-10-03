import Ajv from 'ajv';
import type { Definition, Setting, Settings } from '../catalog/contracts';

const ajv = new Ajv();
const checkObject = ajv.compile({ type: 'object' });
const checkNumber = ajv.compile<number>({ type: 'number' });
const checkBoolean = ajv.compile<boolean>({ type: 'boolean' });
const checkString = ajv.compile<string>({ type: 'string' });
const checkSettings = ajv.compile<Settings>({
  type: 'object',
  additionalProperties: { anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }] },
});

export class FieldError extends Error {
  constructor(public readonly key: string, message: string) { super(message); }
}

export function assertSettings<T>(value: T): asserts value is T & Settings {
  if (!checkObject(value)) throw new Error('Settings must be an object.');
  if (!checkSettings(value)) throw new Error('Settings values must be strings, finite numbers, or booleans.');
}

export function validateValue(setting: Setting, value: Settings[string] | undefined): Settings[string] {
  const fail = (message: string): never => { throw new FieldError(setting.key, `${setting.label}: ${message}`); };

  switch (setting.type) {
    case 'number': {
      const { min, max, step } = setting;

      if (![min, max, step].every(Number.isFinite) || min > max || step <= 0) fail('invalid number constraints.');
      if (!checkNumber(value) || value < min || value > max) return fail(`enter a number between ${min} and ${max}.`);

      const ticks = (value - min) / step;

      if (!Number.isFinite(ticks) || Math.abs(ticks - Math.round(ticks)) >= 1e-7) fail(`use increments of ${step}.`);

      return Object.is(value, -0) ? 0 : value;
    }
    case 'boolean': return checkBoolean(value) ? value : fail('choose on or off.');
    case 'color': return checkString(value) && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : fail('use a six-digit hex color.');
    case 'enum': return checkString(value) && setting.choices.includes(value) ? value : fail('choose a listed option.');
    case 'string': return checkString(value) && [...value].length <= setting.maxLength ? value : fail(`use at most ${setting.maxLength} characters.`);
  }
}

export function defaults(definition: Definition): Settings {
  const result: Record<string, Settings[string]> = Object.create(null);

  for (const setting of definition.settings) {
    if (Object.hasOwn(result, setting.key) || ['constructor', 'prototype', '__proto__'].includes(setting.key)) throw new FieldError(setting.key, 'Duplicate or reserved setting key.');

    result[setting.key] = validateValue(setting, setting.default);
  }

  return Object.freeze(result);
}

export function validateSettings(definition: Definition, proposed: Settings): Settings {
  defaults(definition);

  if (!checkObject(proposed)) throw new Error('Settings must be an object.');
  if (Object.keys(proposed).some(key => !definition.settings.some(s => s.key === key))) throw new Error('Unknown setting.');

  return Object.freeze(Object.fromEntries(definition.settings.map(s => [s.key, validateValue(s, Object.hasOwn(proposed, s.key) ? proposed[s.key] : undefined)])));
}
