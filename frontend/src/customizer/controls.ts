import type { Definition, Settings } from '../catalog/contracts';
import { el } from '../components/dom';
import { FieldError } from './settings';
export function controls(definition: Definition, values: Settings, change: (key: string, value: Settings[string]) => void) {
  const root = el('div', 'controls');
  const inputs = new Map<string, (HTMLInputElement | HTMLSelectElement)[]>();
  const errors = new Map<string, HTMLElement>();
  for (const setting of definition.settings) {
    const field = el('div', 'field'); const label = el('label', 'field-label', setting.label);
    const id = `setting-${setting.key}`; label.htmlFor = id;
    const row = el('div', 'field-row');
    let input: HTMLInputElement | HTMLSelectElement;
    const related: (HTMLInputElement | HTMLSelectElement)[] = [];
    if (setting.type === 'enum') {
      input = el('select');
      for (const choice of setting.choices) { const option = el('option', '', choice); option.value = choice; input.append(option); }
      input.value = String(values[setting.key]); input.addEventListener('change', () => change(setting.key, input.value));
    } else {
      input = el('input'); const control = input;
      control.type = setting.type === 'boolean' ? 'checkbox' : setting.type === 'number' ? 'range' : setting.type === 'color' ? 'color' : 'text';
      if (setting.type === 'number') {
        // Set bounds first: a range input otherwise clamps to the browser's 0..100 defaults.
        control.min = String(setting.min); control.max = String(setting.max); control.step = String(setting.step);
      }
      if (setting.type === 'boolean') control.checked = Boolean(values[setting.key]);
      else control.value = String(values[setting.key]);
      if (setting.type === 'number') {
        const number = el('input', 'number-input'); number.type = 'number'; number.min = control.min; number.max = control.max; number.step = control.step; number.value = control.value;
        number.setAttribute('aria-label', `${setting.label} value`);
        number.addEventListener('input', () => { control.value = number.value; change(setting.key, number.valueAsNumber); });
        control.addEventListener('input', () => { number.value = control.value; change(setting.key, control.valueAsNumber); });
        row.append(number); related.push(number);
      } else if (setting.type === 'color') {
        const text = el('input', 'hex-input'); text.type = 'text'; text.value = control.value; text.maxLength = 7;
        text.setAttribute('aria-label', `${setting.label} hex`);
        text.addEventListener('input', () => { if (/^#[\da-f]{6}$/i.test(text.value)) control.value = text.value; change(setting.key, text.value); });
        control.addEventListener('input', () => { text.value = control.value; change(setting.key, control.value); });
        row.append(text); related.push(text);
      } else {
        control.addEventListener('input', () => change(setting.key, setting.type === 'boolean' ? control.checked : control.value));
      }
    }
    input.id = id; related.push(input); inputs.set(setting.key, related);
    const error = el('p', 'field-error'); error.id = `${id}-error`; error.hidden = true;
    for (const control of related) control.setAttribute('aria-describedby', error.id);
    errors.set(setting.key, error);
    row.prepend(input); field.append(label, row, error); root.append(field);
  }
  return { root, setError(error?: unknown) {
    for (const [key, message] of errors) {
      const active = error instanceof FieldError && error.key === key;
      message.hidden = !active; message.textContent = active ? error.message : '';
      for (const input of inputs.get(key) ?? []) input.setAttribute('aria-invalid', String(active));
    }
  } };
}
