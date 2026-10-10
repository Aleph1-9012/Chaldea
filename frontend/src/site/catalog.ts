import type { Summary } from '../catalog/contracts';

// Plate proportions and display names from Chaldea-Final, node 391:6.
const plates = new Map<string, { title: string; ratio: number }>([
  ['glyphs-branch-grammar', { title: 'Branch Grammar', ratio: 333 / 482 }],
  ['glyphs-glyph-bay-typing', { title: 'Glyph Bay Typing', ratio: 333 / 490 }],
  ['glyphs-oblique-ligatures', { title: 'Oblique Ligatures', ratio: 333 / 484 }],
  ['glyphs-radical-exchange', { title: 'Radical Exchange', ratio: 333 / 486 }],
  ['glyphs-recursive-relays', { title: 'Recursive Relays', ratio: 333 / 484 }],
  ['glyphs-shifted-script', { title: 'Shifted Script', ratio: 333 / 486 }],
  ['interactive-art-fish-in-space', { title: 'Fish In Space', ratio: 686 / 429 }],
  ['interactive-art-gravity-sandbox', { title: 'Gravity Sandbox', ratio: 333 / 208 }],
  ['interactive-art-magnetic-powder', { title: 'Magnetic Powder', ratio: 333 / 208 }],
  ['interactive-art-mechanical-rhythm', { title: 'Mechanical Rhythm', ratio: 333 / 208 }],
  ['interactive-art-orbital-playground', { title: 'Orbital Playground', ratio: 686 / 429 }],
  ['interactive-art-resonance-sculpture', { title: 'Resonance Sculpture', ratio: 333 / 208 }],
  ['interactive-art-signal-hunting', { title: 'Signal Hunting', ratio: 333 / 208 }],
  ['interactive-art-specimen-chamber', { title: 'Specimen Chamber', ratio: 333 / 208 }],
  ['lockscreen-afk-layout-previews-relay-inde-bee7ea', { title: 'Relay Index', ratio: 333 / 362 }],
  ['lockscreen-afk-layout-previews-type-folio-44fc03', { title: 'Type Folio', ratio: 333 / 362 }],
  ['lockscreen-editorial-studies-assembly-mar-4068d0', { title: 'Assembly Mark', ratio: 333 / 336 }],
  ['lockscreen-editorial-studies-foundry-post-598bff', { title: 'Foundry Poster', ratio: 333 / 336 }],
  ['lockscreen-editorial-studies-reverse-prin-7a2bf3', { title: 'Reverse Print', ratio: 333 / 335 }],
  ['lockscreen-mechanical-lockscreen-studies-e940db', { title: 'Punch Record', ratio: 333 / 465 }],
  ['lockscreen-print-iterations-index-spine-c-26d6e1', { title: 'Index Spine', ratio: 333 / 347 }],
  ['lockscreen-print-iterations-open-masthead-08f5cf', { title: 'Open Masthead', ratio: 333 / 345 }],
  ['lockscreen-reactive-lockscreen-studies-fo-efe52f', { title: 'Formation Field', ratio: 333 / 468 }],
  ['lockscreen-reactive-lockscreen-studies-re-a37a9d', { title: 'Relay Tiles', ratio: 333 / 269 }],
  ['lockscreen-reactive-lockscreen-studies-sh-6c6cb4', { title: 'Shutter Bank', ratio: 333 / 462 }],
  ['lockscreen-reactive-lockscreen-studies-st-69ba9c', { title: 'Stencil Assembly', ratio: 333 / 465 }],
  ['lockscreen-reactive-lockscreen-studies-ty-e2b460', { title: 'Typesetter', ratio: 333 / 468 }],
  ['player-ledger', { title: 'Ledger', ratio: 686 / 429 }],
  ['player-matrix', { title: 'Matrix', ratio: 686 / 429 }],
  ['player-rail', { title: 'Rail', ratio: 686 / 340 }],
  ['player-sleeve', { title: 'Sleeve', ratio: 686 / 429 }],
  ['player-title', { title: 'Title', ratio: 333 / 208 }],
  ['quick-notes-ash', { title: 'Ash', ratio: 333 / 375 }],
  ['quick-notes-cassette', { title: 'Cassette', ratio: 333 / 343 }],
  ['quick-notes-console', { title: 'Console', ratio: 333 / 247 }],
  ['quick-notes-index', { title: 'Index', ratio: 333 / 259 }],
  ['quick-notes-preview', { title: 'Preview', ratio: 333 / 366 }],
  ['quick-notes-refined', { title: 'Refined', ratio: 333 / 346 }],
  ['tsugumori', { title: 'Phase Lock', ratio: 333 / 208 }],
]);

export function presentation(widget: Pick<Summary, 'id' | 'title'>) {
  return plates.get(widget.id) ?? { title: widget.title.split(' / ').at(-1) ?? widget.title, ratio: 1.6 };
}

const familyRatios = new Map<string, number>([
  ['Glyphs', 7 / 10],
  ['Interactive art', 8 / 5],
  ['Lockscreens', 1],
  ['Quick notes', 9 / 10],
  ['Player', 8 / 5],
]);

export function familyRatio(category: string): number {
  return familyRatios.get(category) ?? 8 / 5;
}

const familyOrder = ['Glyphs', 'Interactive art', 'Lockscreens', 'Quick notes', 'Player'];

export function familyLabel(name: string): string {
  if (name === 'Quick notes') return 'Notes';
  if (name === 'Interactive art') return 'Art';

  return name;
}

export function families(widgets: readonly Summary[]): string[] {
  return [...new Set(widgets.map(widget => widget.category))].sort((a, b) => {
    const first = familyOrder.indexOf(a);
    const second = familyOrder.indexOf(b);

    return (first < 0 ? familyOrder.length : first) - (second < 0 ? familyOrder.length : second) || a.localeCompare(b);
  });
}

export const padded = (count: number): string => String(count).padStart(2, '0');
