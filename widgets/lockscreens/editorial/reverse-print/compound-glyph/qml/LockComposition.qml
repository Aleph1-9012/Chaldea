// SPDX-License-Identifier: 0BSD
import QtQuick

Item {
    id: layout
    required property LockScreen screen
    property alias auth: login
    readonly property real rightWidth: Math.min(370, Math.max(0, width - 252 - (screen.medium ? 42 : 70)))
    readonly property real rightX: width - rightWidth
    implicitWidth: screen.narrow ? 350 : 790
    implicitHeight: entry.y + entry.height
    LockClock {
        id: clock
        screen: layout.screen
        x: layout.screen.narrow ? 0 : layout.rightX
        width: layout.screen.narrow ? layout.width : layout.rightWidth
        size: layout.screen.narrow ? 32 : layout.screen.medium ? 76 : 96
        tracking: layout.screen.narrow ? -1 : -6
        caption: !layout.screen.narrow
        topGap: layout.screen.narrow ? 0 : 18
        bottomGap: layout.screen.narrow ? 8 : 18
    }
    Item {
        id: bay
        x: layout.screen.narrow ? (layout.width - width) / 2 : 0
        y: layout.screen.narrow ? clock.implicitHeight + 38 : 0
        width: Math.min(252, layout.width)
        height: width + 48.4
        LockArtwork { objectName: "glyphArtwork"; width: parent.width; height: width; phase: layout.screen.phase }
        Rectangle { y: bay.width + 20; width: parent.width; height: 1; color: "#151513" }
        LockText { y: bay.width + 33; text: "継衛"; font.family: "Noto Sans CJK JP"; font.letterSpacing: 1; color: layout.screen.paperColor }
        Row {
            y: bay.width + 33
            anchors.right: parent.right
            LockText { text: "TYPE-17 "; font.letterSpacing: 1; color: layout.screen.mutedColor }
            LockText { text: "//"; font.letterSpacing: 1; color: "#d1161c" }
            LockText { text: " 704"; font.letterSpacing: 1; color: layout.screen.mutedColor }
        }
    }
    Item {
        id: title
        x: layout.screen.narrow ? 0 : layout.rightX
        y: layout.screen.narrow ? bay.y + bay.height + 22 : Math.max(bay.height, clock.implicitHeight + 28 + height) - height
        width: layout.screen.narrow ? layout.width : layout.rightWidth
        height: layout.screen.narrow ? 64.8 : 66.4
        Row {
            x: layout.screen.narrow ? (parent.width - width) / 2 : 0
            spacing: layout.screen.narrow ? 8 : 4
            LockText { text: "継"; color: layout.screen.paperColor; font.family: "Noto Sans CJK JP"; font.weight: Font.Medium; height: font.pixelSize * 1.2; verticalAlignment: Text.AlignVCenter; lineHeightMode: Text.FixedHeight; lineHeight: font.pixelSize * 1.2; font.pixelSize: layout.screen.narrow ? 54 : 42 }
            LockText { text: "衛"; color: layout.screen.paperColor; font.family: "Noto Sans CJK JP"; font.weight: Font.Medium; height: font.pixelSize * 1.2; verticalAlignment: Text.AlignVCenter; lineHeightMode: Text.FixedHeight; lineHeight: font.pixelSize * 1.2; font.pixelSize: layout.screen.narrow ? 54 : 42 }
        }
        Rectangle { visible: !layout.screen.narrow; width: parent.width; height: 2; anchors.bottom: parent.bottom; color: "#d1161c" }
    }
    Rectangle {
        id: entry
        y: title.y + title.height + (layout.screen.narrow ? 22 : 28)
        width: parent.width
        height: layout.screen.narrow ? login.y + login.height + 10 : layout.screen.medium ? 114 : 118
        color: "#151513"
        readonly property int padding: layout.screen.narrow ? 18 : layout.screen.medium ? 24 : 26
        LockIdentity {
            id: identity
            screen: layout.screen
            lightText: true
            nameSize: 17
            x: entry.padding
            y: layout.screen.narrow ? 23 : (entry.height - implicitHeight) / 2
            width: layout.screen.narrow ? parent.width - 36 : layout.screen.medium ? 155 : 190
        }
        LockAuth {
            id: login
            screen: layout.screen
            x: layout.screen.narrow ? 18 : identity.x + identity.width + (layout.screen.medium ? 20 : 28)
            y: layout.screen.narrow ? identity.y + identity.implicitHeight + 16 : entry.padding
            width: Math.max(0, parent.width - x - entry.padding)
            height: implicitHeight
            wordButton: !layout.screen.narrow
        }
    }
}
