import type { Definition, Setting, Settings } from '../catalog/contracts';
export class FieldError extends Error {
  constructor(public readonly key: string, message: string) { super(message); }
}
export function validateValue(setting: Setting, value: unknown): string | number | boolean {
  const fail = (message: string): never => { throw new FieldError(setting.key, `${setting.label}: ${message}`); };
  switch (setting.type) {
    case 'number': {
      const { min, max, step } = setting;
      if (![min, max, step].every(Number.isFinite) || min > max || step <= 0) fail('invalid number constraints.');
      if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) return fail(`enter a number between ${min} and ${max}.`);
      const ticks = (value - min) / step;
      if (!Number.isFinite(ticks) || Math.abs(ticks - Math.round(ticks)) >= 1e-7) fail(`use increments of ${step}.`);
      return Object.is(value, -0) ? 0 : value;
    }
    case 'boolean': return typeof value === 'boolean' ? value : fail('choose on or off.');
    case 'color': return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : fail('use a six-digit hex color.');
    case 'enum': return typeof value === 'string' && setting.choices.includes(value) ? value : fail('choose a listed option.');
    case 'string': return typeof value === 'string' && [...value].length <= setting.maxLength ? value : fail(`use at most ${setting.maxLength} characters.`);
  }
}
export function defaults(definition: Definition): Settings {
  const result: Record<string, string | number | boolean> = Object.create(null) as Record<string, string | number | boolean>;
  for (const setting of definition.settings) {
    if (Object.hasOwn(result, setting.key) || ['constructor', 'prototype', '__proto__'].includes(setting.key)) throw new FieldError(setting.key, 'Duplicate or reserved setting key.');
    result[setting.key] = validateValue(setting, setting.default);
  }
  return Object.freeze(result);
}
export function validateSettings(definition: Definition, proposed: unknown): Settings {
  defaults(definition);
  if (!proposed || typeof proposed !== 'object' || Array.isArray(proposed)) throw new Error('Settings must be an object.');
  const input = proposed as Record<string, unknown>;
  if (Object.keys(input).some(key => !definition.settings.some(s => s.key === key))) throw new Error('Unknown setting.');
  return Object.freeze(Object.fromEntries(definition.settings.map(s => [s.key, validateValue(s, Object.hasOwn(input, s.key) ? input[s.key] : undefined)])));
}
