# Tsugumori / Phase lock

The original Phase field, formation terminals, red folio, and centered K glyph are available as a native QML component. Typing dummy text subdivides the glyph; deleting reverses it. Play lock and Play unlock run the reversible background and panel sequence. The browser retains the original preview.

## Run

Save each file from the output selector into a widget folder, preserving the displayed file names and subfolders. With Quickshell 0.3.0 and Qt 6.11.2 installed, run:

```sh
qs -p /absolute/path/to/the/widget-folder/shell.qml
```

The launcher opens a regular resizable window. It uses Qt Quick, Qt Quick Controls Basic, and Qt Quick Layouts, and leaves desktop configuration alone. Keep every exported file together.

To embed the visual component:

```qml
import "./phase-lock" as Phase

Phase.Widget {
    width: 1024
    userName: "PREVIEW USER"
    clockText: "00:14"
    dateText: "14 SEP"
    weekdayText: "MON // 2026"
}
```

The time and user labels are demonstration values. An embedding application can bind those properties to its own data. `animationEnabled` disables transitions. `play(1)` replays the lock sequence; `play(0)` clears the scene. `previewRequested(int length)` reports an unlock preview request. `inputLength`, `phase`, `progress`, and `previewing` expose visual state. `focusInput()` and `setInputLength(length)` support integration and inspection.

## Interaction and limits

Use Tab and Shift+Tab to move through controls. Type dummy text, select and delete, press Escape to clear it, or press Enter to preview unlock. The component keeps only a bounded length and masked placeholders after committed edits. It holds no persistent state. Hiding it stops animation and settles to the requested target.

This is a visual lockscreen component. It does not authenticate, lock a desktop session, or invoke power commands. The launcher is a preview window, not a secure lockscreen. Use dummy text only. Real authentication and session locking require a separate host implementation.

`PhaseArt.js` retains the original drawing rules with the fixed Phase field and formation terminals. JetBrains Mono and Noto Sans CJK JP are optional system fonts; no fonts are bundled. Font fallback can affect text metrics.

Native verification uses exact generated files in an isolated Quickshell configuration. It covers loading, input and selection deletion, replay and reversal, hidden animation, and desktop/narrow rendering. It does not establish authentication or compositor integration.

## Source and license

Adapted from the owner's `Lib-assests/lockscreen/tsugumori-phase-formation-lock.html`. Remote font imports were removed, the example username was replaced, and scripts were made local. Original widget, native implementation, and preview code use 0BSD. The output file list includes `LICENSE`. No rights to third-party names or characters are asserted.
