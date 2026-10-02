# Tsugumori / Fish in space

The Fish in space design from the owner-supplied `Lib-assests/interactive-art/tsugumori-drift-and-tsumugi.html`, available as its own widget in XLR8.

## Try it

Each fish swims along its own path with a separate pace and swimming rhythm. A wave passes through the front of the body and the fins before growing into the tail stroke. Turns begin at the head and reach the tail with a short delay. Click or tap the canvas to give both a brief burst toward that area. They approach separate spots beside the click, ease off, then resume independent swimming. Moving the pointer alone does not steer them.

The fish steer around each other with space for their fins and tails. Near an edge they ease their speed and curve along the wall, keeping room for the tail to swing through the turn. A fish has arrived when its head reaches the destination area, so it can turn away without pressing its whole body toward the edge. Narrow previews use smaller fish so both have room to swim.

Gather calls them toward the center; Release lets them roam. A new canvas click releases the gathered pair and chooses a destination. Focus the canvas and press Enter or Space to call them to the center. Pause freezes the scene, and reduced-motion preference starts it paused. Clicks while paused queue a destination for the next Play.

Fish particle trails adds a short wake behind each tail. Fish detail controls the density of the skeletal drawing.

Use the controls inside the preview. Settings below it adjust this design. State stays in memory and resets when you leave. Fonts and icons are local, with no external requests.

## Implementation status

Interactive HTML draft. Native QML, desktop integration, authentication, and widget export are not implemented. `make dev` includes this preview; production builds omit it. Original widget code and local icon markup use 0BSD.

Source SHA-256: `7948dc2f2a16ee848de4592d1d9c58dcbf8d756b7ebdfb0594e077880cb95875`. The source archive is unchanged. This widget extracts one design, keeps its direct interactions, and connects its settings to the sandbox preview runtime.
