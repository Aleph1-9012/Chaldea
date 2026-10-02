# Player

Matrix, Sleeve, Rail, Ledger, and Title each have an independent QML export and are included in production builds. The exports use Quickshell’s MPRIS service, `Quickshell.Services.Mpris`, for metadata, artwork, playback, seeking, and source selection. Controls follow each media application’s capabilities. A source list replaces the preview’s sample collection. Browser previews use silent sample tracks. Appearance settings preserve the selected track or source.

## Shared files

`_shared/qml/` holds the helpers all five designs use unchanged: `PlayerBase.qml`, `PlayerBackend.qml`, `PlayerArtwork.qml`, `PlayerButton.qml`, `PlayerSeek.qml`, `PlayerSources.qml`, `PlayerText.qml`, `PlayerTransport.qml`, and the `shell.qml` launcher. Each widget folder keeps its design component, such as `MatrixPlayer.qml`, with its `Widget.qml.tmpl`, preview, thumbnail, and README.

## Native behavior

If a native player is idle, start an application that exposes MPRIS on the same session bus. Missing or disabled actions follow the application’s reported capabilities; seeking also requires a known duration. A selected source that closes falls back to another available player. Album art loads from the URL supplied by that application. The browser cannot verify these integrations.

## Inspect a change

Export the exact files with the documented Bun export command and use their `shell.qml`. A private `dbus-run-session` prevents test controls from reaching live media apps; populate that bus with a test media service when checking playback behavior. Local offscreen rendering verifies layout and QML loading but does not verify compositor placement or every media application’s MPRIS behavior.
