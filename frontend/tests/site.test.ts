import { expect, test } from 'bun:test';
import { masonry, rows } from '../src/site/masonry';
import { libraryUrl } from '../src/site/links';

test('library layouts keep every card inside the container without overlapping at desktop and phone widths', () => {
  const items = Array.from({ length: 39 }, (_, index) => ({ id: `card-${index}`, ratio: [0.69, 1, 1.6, 2.02, 0.89][index % 5]! }));

  for (const layout of [masonry, rows]) {
    for (const width of [272, 342, 680, 1232, 1392, 1872, 2512]) {
      const { cards, height } = layout(items, width);
      expect(cards.map(card => card.id)).toEqual(items.map(item => item.id));

      for (const [index, card] of cards.entries()) {
        expect(card.x).toBeGreaterThanOrEqual(0);
        expect(card.y).toBeGreaterThanOrEqual(0);
        expect(card.x + card.width).toBeLessThanOrEqual(width + 0.001);
        expect(card.y + card.height).toBeLessThanOrEqual(height + 0.001);

        for (const other of cards.slice(index + 1)) {
          const overlaps = card.x < other.x + other.width && card.x + card.width > other.x
            && card.y < other.y + other.height && card.y + card.height > other.y;
          expect(overlaps).toBe(false);
        }
      }
    }
  }
});

test('filtered rows preserve reading order and start the final partial row at the left', () => {
  const items = Array.from({ length: 11 }, (_, index) => ({ id: `card-${index}`, ratio: .65 + index / 20 }));
  const { cards } = rows(items, 1872);
  expect(cards[5]?.x).toBe(0);
  expect(cards[10]?.x).toBe(0);
  expect(cards.slice(5, 10).every(card => card.y === cards[5]?.y)).toBe(true);
  expect(cards[5]!.y).toBeGreaterThan(Math.max(...cards.slice(0, 5).map(card => card.y + card.height)));

  const mixed = rows([{ id: 'wide', ratio: 1.6 }, { id: 'tall', ratio: .7 }, { id: 'small', ratio: 1.6 }, { id: 'wide-next', ratio: 2 }, { id: 'last', ratio: 1 }], 1392);
  expect([...mixed.cards].sort((a, b) => a.y - b.y || a.x - b.x).map(card => card.id)).toEqual(['wide', 'tall', 'small', 'wide-next', 'last']);
  expect(mixed.cards[4]?.x).toBe(0);
  expect(rows([], 1392)).toEqual({ cards: [], height: 0 });
});

test('family rows give portrait and landscape cards equal dimensions at every breakpoint', () => {
  for (const ratio of [.7, .9, 1, 1.6]) {
    const items = Array.from({ length: 11 }, (_, index) => ({ id: `card-${index}`, ratio }));

    for (const width of [272, 342, 802, 1392, 2000]) {
      const { cards } = rows(items, width, ratio >= 1.5 ? 480 : 320);
      expect(new Set(cards.map(card => card.width)).size).toBe(1);
      expect(new Set(cards.map(card => card.height)).size).toBe(1);
      expect(cards.every(card => card.x + card.width <= width + .001)).toBe(true);
    }
  }
});

test('filtering and reordering repack the remaining cards deterministically', () => {
  const items = [{ id: 'wide', ratio: 2 }, { id: 'tall', ratio: .65 }, { id: 'square', ratio: 1 }];
  expect(masonry([], 1392)).toEqual({ cards: [], height: 0 });
  expect(masonry(items, 1392)).toEqual(masonry(items, 1392));
  expect(masonry(items.slice(1), 342).cards[0]?.y).toBe(0);
  expect(masonry([...items].reverse(), 342).cards.map(card => card.id)).toEqual(['square', 'tall', 'wide']);
  expect(masonry(items, 1392).cards[0]?.width).toBe(686);
});

test('library links preserve family and search punctuation without storing customization', () => {
  const params = new URLSearchParams(libraryUrl('Quick notes', 'family', 'red & blue + #1').slice(1));
  expect(params.get('family')).toBe('Quick notes');
  expect(params.get('sort')).toBe('family');
  expect(params.get('q')).toBe('red & blue + #1');
  expect(libraryUrl()).toBe('?page=library');
});
