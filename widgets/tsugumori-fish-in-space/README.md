# Tsugumori / Fish in space

The Fish in space design from the owner-supplied `Lib-assests/interactive-art/tsugumori-drift-and-tsumugi.html`, available as its own widget in XLR8.

## Try it

Move the pointer to attract the skeletal fish, gather or release the pair, and pause or resume the animation.

Use the controls inside the preview. Settings below it adjust this design. State stays in memory and resets when you leave. Fonts and icons are local, with no external requests.

## Implementation status

Interactive HTML draft. Native QML, desktop integration, authentication, and widget export are not implemented. `make dev` includes this preview; production builds omit it. Original widget code and local icon markup use 0BSD.

Source SHA-256: `7948dc2f2a16ee848de4592d1d9c58dcbf8d756b7ebdfb0594e077880cb95875`. The source archive is unchanged. This widget extracts one design, keeps its direct interactions, and connects its settings to the sandbox preview runtime.
