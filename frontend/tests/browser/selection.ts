const raw = process.env.CHALDEA_TEST_WIDGETS;
const selected: unknown = raw ? JSON.parse(raw) : null;
if (selected !== null && (!Array.isArray(selected) || selected.some(id => typeof id !== 'string'))) {
  throw new Error('CHALDEA_TEST_WIDGETS must be a JSON array of widget IDs.');
}
export const includesWidget = (id: string): boolean => selected === null || (selected as string[]).includes(id);
