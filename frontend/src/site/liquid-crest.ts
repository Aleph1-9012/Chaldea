export function liquidCrest(progress: number, index: number): string {
  const rise = progress * progress * (3 - 2 * progress);
  const level = 1.12 - rise * 1.24;
  const amplitude = Math.sin(progress * Math.PI) * .072;
  const phase = progress * Math.PI * 3 + index * 1.35;
  const frequency = Math.PI * 2;
  const height = (x: number) => level + amplitude * (Math.sin(x * frequency + phase) + .22 * Math.sin(x * frequency * 2 - phase));
  const slope = (x: number) => amplitude * frequency * (Math.cos(x * frequency + phase) + .44 * Math.cos(x * frequency * 2 - phase));
  const segments = [`M -.08 ${height(-.08)}`];

  // Cubic tangents keep the moving crest curved at every responsive size.
  for (let segment = 0; segment < 6; segment++) {
    const left = -.08 + segment * 1.16 / 6;
    const right = -.08 + (segment + 1) * 1.16 / 6;
    const handle = (right - left) / 3;
    segments.push(`C ${left + handle} ${height(left) + slope(left) * handle} ${right - handle} ${height(right) - slope(right) * handle} ${right} ${height(right)}`);
  }

  return `${segments.join(' ')} L 1.08 1.12 L -.08 1.12 Z`;
}
