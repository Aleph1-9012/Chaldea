# Tsugumori / Shifted script

The Shifted script design from the owner-supplied `Lib-assests/glyphs/tsugumori-five-glyph-studies.html`, available as its own widget in XLR8.

## Try it

The preview contains the glyph artwork and demo input panel shown in the owner's reference, with User, Unlock, and the session line.

Columns of glyph fragments slide in opposing directions and change their alignments. Type dummy text to change the glyphs, erase it to reverse them, and try the Unlock preview.

Use the controls inside the preview. Settings below it adjust this design. State stays in memory and resets when you leave. Fonts and icons are local, with no external requests.

## Implementation status

Interactive HTML draft. Native QML, desktop integration, authentication, and widget export are not implemented. `make dev` includes this preview; production builds omit it. Original widget code and local icon markup use 0BSD.

Source SHA-256: `01224cfd169df19cff0b715b913acd964c391ba73fc02de68e9f2fb3ceff1ba0`. The source archive is unchanged. This widget extracts one design, keeps its direct interactions, and connects its settings to the sandbox preview runtime.
