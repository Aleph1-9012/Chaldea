// SPDX-License-Identifier: 0BSD
import QtQuick

Item {
    id: layout
    required property LockScreen screen
    property alias auth: login
    implicitWidth: 350
    implicitHeight: entry.y + entry.height
    LockClock {
        id: clock
        screen: layout.screen
        width: parent.width
        size: layout.screen.narrow ? 32 : 22
        tracking: layout.screen.narrow ? -1 : 0
        inlineDate: true
        bottomGap: layout.screen.narrow ? 8 : 0
    }
    Rectangle { visible: !layout.screen.narrow; width: parent.width; height: 1; y: clock.implicitHeight + 18; color: layout.screen.lineColor }
    LockArtwork {
        id: art
        objectName: "glyphArtwork"
        width: Math.min(252, layout.width)
        height: width
        x: (layout.width - width) / 2
        y: clock.implicitHeight + (layout.screen.narrow ? 38 : 47)
        phase: layout.screen.phase
    }
    Rectangle { visible: !layout.screen.narrow; x: art.x - 18; y: art.y + 6; width: 3; height: 76; color: "#d1161c" }
    Row {
        id: title
        y: art.y + art.height + (layout.screen.narrow ? 22 : 18)
        x: (layout.width - width) / 2
        spacing: 8
        height: layout.screen.narrow ? 64.8 : 76.8
        LockText { text: "継"; color: layout.screen.paperColor; font.family: "Noto Sans CJK JP"; font.weight: Font.Medium; height: font.pixelSize * 1.2; verticalAlignment: Text.AlignVCenter; lineHeightMode: Text.FixedHeight; lineHeight: font.pixelSize * 1.2; font.pixelSize: layout.screen.narrow ? 54 : 64; font.letterSpacing: layout.screen.narrow ? 0 : 8 }
        LockText { text: "衛"; color: layout.screen.paperColor; font.family: "Noto Sans CJK JP"; font.weight: Font.Medium; height: font.pixelSize * 1.2; verticalAlignment: Text.AlignVCenter; lineHeightMode: Text.FixedHeight; lineHeight: font.pixelSize * 1.2; font.pixelSize: layout.screen.narrow ? 54 : 64; font.letterSpacing: layout.screen.narrow ? 0 : 8 }
    }
    Item {
        id: entry
        y: title.y + title.height + (layout.screen.narrow ? 22 : 20)
        width: parent.width
        height: login.y + login.height
        Rectangle { width: parent.width; height: 1; color: layout.screen.lineColor }
        LockIdentity { id: identity; screen: layout.screen; y: 19; width: parent.width; inlineName: true }
        LockAuth {
            id: login
            screen: layout.screen
            width: parent.width
            height: implicitHeight
            y: identity.y + identity.implicitHeight + (layout.screen.narrow ? 16 : 14)
        }
    }
}
