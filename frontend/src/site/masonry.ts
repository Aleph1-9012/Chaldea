interface Plate {
  id: string;
  ratio: number;
}

interface Placement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Filtered shelves keep reading order, with each new row starting at the left.
export function rows(items: readonly Plate[], width: number, minimumCardWidth = 320): { cards: Placement[]; height: number } {
  const columns = Math.max(1, Math.floor((width + 20) / (minimumCardWidth + 20)));
  const columnWidth = Math.max(1, (width - (columns - 1) * 20) / columns);
  const cards: Placement[] = [];
  let column = 0;
  let y = 0;
  let bottom = 0;

  for (const item of items) {
    if (column === columns) {
      column = 0;
      y = bottom + 24;
    }

    const height = columnWidth / item.ratio + 43;
    cards.push({ id: item.id, x: column * (columnWidth + 20), y, width: columnWidth, height });
    bottom = Math.max(bottom, y + height);
    column++;
  }

  return { cards, height: bottom };
}

// Chaldea's two-column cards may look ahead to fill an uneven adjacent pair.
export function masonry(items: readonly Plate[], width: number): { cards: Placement[]; height: number } {
  const columns = Math.max(1, Math.floor((width + 20) / 340));
  const columnWidth = Math.max(1, (width - (columns - 1) * 20) / columns);
  const bottoms = Array<number>(columns).fill(0);
  const placed = new Map<string, Placement>();
  let wideIndex = 0;

  const remaining = items.map(item => ({
    ...item,
    wide: item.ratio >= 1.59 && wideIndex++ % 2 === 0 && columns > 1,
  }));

  function place(item: Plate, column: number, span: number): void {
    const cardWidth = columnWidth * span + (span - 1) * 20;
    const y = Math.max(...bottoms.slice(column, column + span));
    const height = cardWidth / item.ratio + 43;
    placed.set(item.id, { id: item.id, x: column * (columnWidth + 20), y, width: cardWidth, height });

    for (let i = column; i < column + span; i++) bottoms[i] = y + height + 24;
  }

  function lowestColumn(): number {
    return bottoms.indexOf(Math.min(...bottoms));
  }

  while (remaining.length) {
    const item = remaining.shift()!;

    if (!item.wide) {
      place(item, lowestColumn(), 1);
      continue;
    }

    let pair = 0;
    let score = Infinity;

    for (let i = 0; i < columns - 1; i++) {
      const left = bottoms[i]!;
      const right = bottoms[i + 1]!;
      const candidate = Math.max(left, right) + 2 * Math.abs(left - right);

      if (candidate < score) {
        score = candidate;
        pair = i;
      }
    }

    for (let fill = 0; fill < 2 && Math.abs(bottoms[pair]! - bottoms[pair + 1]!) > 80; fill++) {
      const next = remaining.findIndex((candidate, index) => index < 4 && !candidate.wide);

      if (next < 0) break;

      const filler = remaining.splice(next, 1)[0]!;
      place(filler, bottoms[pair]! <= bottoms[pair + 1]! ? pair : pair + 1, 1);
    }

    if (Math.abs(bottoms[pair]! - bottoms[pair + 1]!) <= 80) place(item, pair, 2);
    else place(item, lowestColumn(), 1);
  }

  return { cards: items.map(item => placed.get(item.id)!), height: Math.max(0, ...bottoms) - (items.length ? 24 : 0) };
}
