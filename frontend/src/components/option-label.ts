export function optionLabel(label: string, index: number): string {
  const number = String(index + 1).padStart(2, '0');

  if (label === number) return label;

  const title = label.startsWith(`${number}//`) ? label.slice(number.length + 2).trimStart() : label;

  return `${number} ${title}`;
}
