# Tsugumori / Radical exchange

The Radical exchange design from the owner-supplied `Lib-assests/glyphs/tsugumori-five-glyph-studies.html`, available as its own widget in Chaldea.

## Try it

The preview contains the glyph artwork and demo input panel shown in the owner's reference, with User, Unlock, and the session line.

Paired glyph fragments interlock, separate, and recombine. Type dummy text to change the glyphs, erase it to reverse them, and try the Unlock preview.

Use the controls inside the preview. Settings below it adjust this design. State stays in memory and resets when you leave. Fonts and icons are local, with no external requests.

## Implementation status

Interactive HTML draft. Native QML, desktop integration, authentication, and widget export are not implemented. `make dev` includes this preview; production builds omit it. Original widget code and local icon markup use 0BSD.

Source SHA-256: `01224cfd169df19cff0b715b913acd964c391ba73fc02de68e9f2fb3ceff1ba0`. The source archive is unchanged. This widget extracts one design, keeps its direct interactions, and connects its settings to the sandbox preview runtime.
