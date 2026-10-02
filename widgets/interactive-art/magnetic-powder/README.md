# Tsugumori / Magnetic powder

The Magnetic powder design from the owner-supplied `Lib-assests/interactive-art/tsugumori-eight-play-studies.html`, available as its own widget in Chaldea.

## Try it

Drag a pole across the plate. Flip polarity or add a third magnet. Pause or resume with the animation control.

Use the controls inside the preview. Settings below it adjust this design. State stays in memory and resets when you leave. Fonts and icons are local, with no external requests.

## Implementation status

Interactive HTML draft. Native QML, desktop integration, authentication, and widget export are not implemented. `make dev` includes this preview; production builds omit it. Original widget code and local icon markup use 0BSD.

Source SHA-256: `32346a91f1ca8662f70729f4684fc8bd49ef8958f4b1aa66ad85f31835aaca90`. The source archive is unchanged. This widget extracts one design, keeps its direct interactions, and connects its settings to the sandbox preview runtime.
