# Tsugumori / Session fossils

The Session fossils design from the owner-supplied `Lib-assests/interactive-art/tsugumori-play-lab.html`, available as its own widget in XLR8.

## Try it

Choose a sample session, rotate its fossil, name it, and keep it in the preview archive. State resets when you leave this widget.

Use the controls inside the preview. Settings below it adjust this design. State stays in memory and resets when you leave. Fonts and icons are local, with no external requests.

## Implementation status

Interactive HTML draft. Native QML, desktop integration, authentication, and widget export are not implemented. `make dev` includes this preview; production builds omit it. Original widget code and local icon markup use 0BSD.

Source SHA-256: `7602b97ddbef589470b84531394c4302b5b684a4c96737fad5a933f110520529`. The source archive is unchanged. This widget extracts one design, keeps its direct interactions, and connects its settings to the sandbox preview runtime.
