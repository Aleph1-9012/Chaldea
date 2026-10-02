# Tsugumori / Glyph Bay typing

Existing owner-supplied design from `Lib-assests/glyphs/tsugumori-glyph-bay-typing.html`.

## Try it

The preview contains the glyph artwork and demo input panel shown in the owner's reference, with User, Unlock, and the session line.

Type dummy text to move the red glyphs. Backspace reverses the movement. Enter or Unlock replays the curtain.

Preview settings map to the original design controls. Browser state stays in memory. Fonts use the local system; there are no external font, icon, or network dependencies.

## Implementation status

Interactive HTML draft. No native QML, native authentication, desktop integration, or widget export is implemented. `make dev` includes this preview; production builds omit it. Original widget code and the local icon markup use 0BSD.

Source SHA-256: `33923000189a6e3c49a82a8b2fca03dee7907f10db51d1248435d55461a7dc58`. The archive is unchanged. Adaptation adds the sandbox document, local icons, preview settings connection, and responsive host integration.
