# Tsugumori / Player directions / Sleeve

Sleeve keeps the narrow archive spine and framed cover. Hover over available artwork to reveal its color. Play/pause, previous, next, and seeking control the selected desktop media player through MPRIS. Artwork and stronger outer borders remain customization settings.

## Run

Save each file from the output selector into a widget folder, preserving the displayed file names and subfolders. Keep `Widget.qml` beside its helper QML files. With Quickshell 0.3.0 and Qt 6.11.2 installed, run:

```sh
qs -p /absolute/path/to/the/widget-folder/shell.qml
```

The example opens a regular, resizable window. It uses Qt Quick, Qt Quick Controls Basic, Qt Quick Layouts, and Quickshell.Services.Mpris. It does not change desktop configuration. To embed it in an existing Quickshell layout:

```qml
import "./player-sleeve" as Player

Player.Widget {
    width: 360
}
```

Use Tab, Shift+Tab, Enter/Space, and the seek slider's arrow keys. The two appearance properties at the top of `Widget.qml` match the browser settings. Copy and Download use the same generated files; supporting QML files are required.

## Media sources

Open a media application that exposes MPRIS on your session bus. The widget initially selects a playing source, or the first available source. Use Sources to choose one explicitly. Ledger shows this list directly. That choice stays active until the source disappears. Selection is kept only in memory.

The list contains connected players and their current tracks. It is not a music library or playback queue. Quickshell 0.3 does not implement the MPRIS TrackList or Playlist interfaces. Previous and Next use the selected application's queue. See the [Quickshell MPRIS documentation](https://quickshell.org/docs/v0.3.0/types/Quickshell.Services.Mpris/MprisPlayer/).

Controls are disabled when the source reports that it cannot perform the action. Seeking also requires a known duration and supported position. Missing metadata gets a text fallback; missing track numbers and durations show `--`. No connected player produces an idle state. Closing a selected player falls back to another available source.

Cover art comes from the URL supplied by the selected media player, which can be a local file or a remote image. Turning Artwork available off hides it. Unavailable or failed artwork shows a placeholder. JetBrains Mono is used when installed, with Qt's system fallback otherwise. No fonts or audio files are bundled.

## Browser preview

The browser uses four silent sample tracks to demonstrate playback, seeking, track selection, and artwork. It does not connect to desktop services or play audio. Appearance changes preserve the selected sample track and playback position. The native download controls real media applications instead of using those samples.

## Source and license

This is one design from the owner-supplied `Lib-assests/player/tsugumori-player-directions.html`. Each design remains a separate widget. The original archive is unchanged.

Source SHA-256: `92f5f7aaf835c78f3f0ec115402620c5f6d279a5f8f48b82d618f8b0b9aff7be`.

Original widget, native implementation, and preview code use 0BSD. The output file list includes `LICENSE`.
