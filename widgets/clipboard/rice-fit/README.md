# Tsugumori / Clipboard rice fit

Existing owner-supplied design from `Lib-assests/clipboard/tsugumori-clipboard-rice-fit.html`.

## Try it

Search the sample history, select entries, pin or unpin them, and filter to pinned entries. Delete removes a sample and Undo restores it. Use entry reports a simulated restore. Arrow keys move between history entries; Escape closes the drawer and Reopen preview restores it. The original Bone/Charcoal palette and fine-grid options appear below the preview.

Settings map to the original design controls. State stays in memory and resets when you leave or reload this preview. Both clipboard designs use sample entries only; they do not read or write the system clipboard. Fonts use the local system, and icons are inline SVG with no external dependencies.

## Implementation status

Interactive HTML draft. No native QML, clipboard service, desktop integration, or widget export is implemented. `make dev` includes this preview; production builds omit it. Original widget code and local icon markup use 0BSD.

Source SHA-256: `31354ac9d18ab77624b27f0fda643faba3b6c79aec10ab6eef4f4e170d583924`. The archive is unchanged. Adaptation adds the sandbox document, local icons where needed, the Chaldea preview settings connection, and responsive host integration.
