/* Quick notes appearance settings. Original code, 0BSD. */
(() => {
  'use strict';
  const root = document.querySelector('[id^="ts-notes-"]');
  const presets = {
    Cobalt: ['#101827', '#e5edfa', '#82afff'],
    Forest: ['#121e19', '#e4eee7', '#8abb9c'],
    Paper: ['#f4ecdd', '#2d2923', '#9a4824'],
  };
  const channels = hex => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
  const blend = (a, b, amount) => '#' + channels(a).map((c, i) => Math.round(c + (channels(b)[i] - c) * amount).toString(16).padStart(2, '0')).join('');
  const luminance = hex => channels(hex).map(c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
  window.XLR8NotesAppearance = {
    apply(settings) {
      const palette = settings.s2Palette || settings.palette || 'Original';
      const custom = !['Original', 'Bone', 'Red'].includes(palette);
      const [paper, ink, accent] = presets[palette] || [settings.backgroundColor, settings.textColor, settings.accentColor];
      const tokens = {
        paper, ink, accent,
        muted: blend(paper, ink, 0.65),
        rule: blend(paper, accent, 0.45),
        hover: blend(paper, ink, 0.10),
        'accent-rgb': channels(accent).join(','),
        'ink-rgb': channels(ink).join(','),
        'on-accent': luminance(accent) > 0.179 ? '#0a0a0a' : '#f5f5f0',
      };
      for (const [key, value] of Object.entries(tokens)) {
        if (custom) root.style.setProperty('--notes-' + key, value);
        else root.style.removeProperty('--notes-' + key);
      }
      root.dataset.appearance = palette;
      root.dataset.customPalette = String(custom);
      if (custom) root.style.colorScheme = luminance(paper) > 0.179 ? 'light' : 'dark';
      else root.style.removeProperty('color-scheme');
    },
  };
})();
