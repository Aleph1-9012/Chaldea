// SPDX-License-Identifier: 0BSD
import QtQuick

Rectangle {
    id: root
    property int transitionTime: 100
    property int emphasis: 100
    property bool animationEnabled: true
    readonly property int inputLength: controller.length
    readonly property real phase: controller.phase
    readonly property bool previewing: controller.previewing
    readonly property bool compact: width <= 670
    readonly property bool medium: width <= 850
    readonly property real mainPadding: compact ? 32 : medium ? 44 : 56
    readonly property real sideMargin: compact ? 20 : medium ? 32 : 48
    readonly property real layoutWidth: Math.min(compact ? 350 : 736, width - sideMargin * 2)
    readonly property real artSide: compact ? Math.min(280, layoutWidth) : medium ? 300 : 320
    readonly property real clockWidth: medium ? 168 : 184
    readonly property real titleWidth: medium ? 56 : 64
    readonly property real columnGap: (layoutWidth - clockWidth - artSide - titleWidth) / 2
    readonly property real layoutHeight: compact ? 329.2 + artSide : artSide + 181.98
    signal previewRequested(int length)
    signal powerRequested(string action)
    implicitWidth: 1000
    implicitHeight: Math.max(790, header.y + header.height + mainPadding * 2 + layoutHeight + footer.height + 25)
    color: "#090909"
    clip: true
    function focusInput(): void { controller.focusInput(); }
    function setInputLength(value: int): void { controller.setInputLength(value); }
    function replay(): void { controller.replay(); }

    Image { anchors.fill: parent; source: "Wallpaper.jpg"; fillMode: Image.PreserveAspectCrop; opacity: .035 }
    LockSession {
        id: controller
        input: auth.input
        transitionTime: root.transitionTime
        animationEnabled: root.animationEnabled
        onPreviewRequested: length => root.previewRequested(length)
        onPowerRequested: action => root.powerRequested(action)
    }
    LockHeader {
        id: header
        x: root.compact ? 20 : 32; y: root.compact ? 24 : 26
        width: parent.width - x * 2; height: implicitHeight
        compact: root.compact
        muted: "#98948a"
        enabled: !controller.powerAction
    }
    Item {
        id: layout
        x: (parent.width - width) / 2
        y: header.y + header.height + (footer.y - header.y - header.height - height) / 2
        width: root.layoutWidth; height: root.layoutHeight
        enabled: !controller.powerAction
        LockClock {
            id: clock
            width: root.compact ? parent.width : root.clockWidth
            height: implicitHeight
            spine: true; compact: root.compact
            size: root.compact ? 44 : root.medium ? 132 : 146
            muted: "#98948a"
        }
        Item {
            id: title
            x: root.compact ? 0 : parent.width - width
            y: root.compact ? 102.2 : 0
            width: root.compact ? parent.width : root.titleWidth
            height: root.compact ? 59.8 : 249.9
            Rectangle { visible: !root.compact; width: parent.width; height: 3; color: "#d1161c" }
            LockText {
                anchors.horizontalCenter: parent.horizontalCenter
                y: root.compact ? 0 : 23
                text: root.compact ? "継衛" : "継\n衛"
                height: root.compact ? 59.8 : font.pixelSize * 2.36
                verticalAlignment: Text.AlignVCenter
                font.weight: Font.Medium
                font.letterSpacing: root.compact ? 2 : 0
                font.family: "Noto Sans CJK JP"
                font.pixelSize: root.compact ? 52 : root.medium ? 50 : 58
                lineHeightMode: Text.FixedHeight; lineHeight: font.pixelSize * 1.18
                color: "#e4e2dc"
            }
            LockText {
                visible: !root.compact
                anchors.horizontalCenter: parent.horizontalCenter
                y: 23 + (root.medium ? 50 : 58) * 2.36 + 30
                text: "東\n亜\n重\n工"; color: "#98948a"
                font.family: "Noto Sans CJK JP"; font.pixelSize: 11
                lineHeightMode: Text.FixedHeight; lineHeight: 15
            }
        }
        Item {
            id: bay
            x: root.compact ? (parent.width - width) / 2 : root.clockWidth + root.columnGap
            y: root.compact ? 186 : 0
            width: root.artSide; height: width + (root.compact ? 0 : 51.8)
            LockArtwork { width: parent.width; height: width; phase: root.phase }
            Rectangle { visible: !root.compact; y: parent.width + 22; width: parent.width; height: 1; color: "#393630" }
            LockText { visible: !root.compact; y: parent.width + 35; text: "継衛"; font.family: "Noto Sans CJK JP"; font.pixelSize: 12; color: "#e4e2dc" }
            Row {
                visible: !root.compact; anchors.right: parent.right; y: parent.width + 35; spacing: 8
                LockText { text: "TYPE-17"; font.letterSpacing: 1; color: "#98948a" }
                LockText { text: "//"; color: "#d1161c" }
                LockText { text: "704"; color: "#98948a" }
            }
        }
        Item {
            x: root.compact ? 0 : bay.x
            y: bay.y + bay.height + (root.compact ? 24 : 30)
            width: root.compact ? parent.width : bay.width
            height: auth.height + (root.compact ? 19 : 0)
            Rectangle { visible: root.compact; width: parent.width; height: 1; color: "#393630" }
            LockAuth {
                id: auth
                y: root.compact ? 19 : 0
                width: parent.width; height: implicitHeight
                session: controller
                inlineIdentity: true
                muted: "#98948a"; line: "#393630"
            }
        }
    }
    LockFooter {
        id: footer
        x: root.compact ? 20 : 32
        y: root.height - height - (root.compact ? 24 : 25)
        width: parent.width - x * 2; height: implicitHeight
        session: controller; printLayout: true
        muted: "#98948a"; line: "#282724"
        enabled: !controller.powerAction
    }
    LockOverlay { anchors.fill: parent; session: controller; muted: "#98948a"; line: "#393630" }
}
