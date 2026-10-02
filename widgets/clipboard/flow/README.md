# Tsugumori / Clipboard flow

Existing owner-supplied design from `Lib-assests/clipboard/tsugumori-clipboard-flow.html`.

## Try it

Search the sample history, select an image, link, or text entry, and choose Use entry. The history closes and Paste inserts that sample into the simulated destination app. Open history reopens it. Pin/unpin, the pinned filter, deletion, and Enter on a history row work inside the preview.

Settings map to the original design controls. State stays in memory and resets when you leave or reload this preview. Both clipboard designs use sample entries only; they do not read or write the system clipboard. Fonts use the local system, and icons are inline SVG with no external dependencies.

## Implementation status

Interactive HTML draft. No native QML, clipboard service, desktop integration, or widget export is implemented. `make dev` includes this preview; production builds omit it. Original widget code and local icon markup use 0BSD.

Source SHA-256: `cd5095c0b8ee81c7a8a09623449ce25939ba6a33421817203f9b4c486dc1dcf0`. The archive is unchanged. Adaptation adds the sandbox document, local icons where needed, the XLR8 preview settings connection, and responsive host integration.
