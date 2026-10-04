// SPDX-License-Identifier: 0BSD
import QtQuick

Rectangle {
    id: root
    property int transitionTime: 180
    property int emphasis: 100
    property bool animationEnabled: true
    readonly property int inputLength: controller.length
    readonly property real phase: controller.phase
    readonly property bool previewing: controller.previewing
    readonly property bool compact: width <= 670
    readonly property bool medium: width <= 850
    readonly property real mainPadding: compact ? 30 : medium ? 32 : 36
    readonly property real sideMargin: compact ? 20 : medium ? 24 : 32
    readonly property real layoutWidth: Math.min(compact ? 370 : 920, width - sideMargin * 2)
    readonly property real artSide: compact ? layoutWidth : medium ? 300 : Math.min(380, (layoutWidth - 160) / 2)
    readonly property real layoutHeight: compact ? 512.66 + artSide : medium ? 470 : 540
    signal previewRequested(int length)
    signal powerRequested(string action)
    implicitWidth: 1000
    implicitHeight: Math.max(840, header.y + header.height + mainPadding * 2 + layoutHeight + footer.height + 24)
    color: "#090909"
    clip: true

    function focusInput(): void { controller.focusInput(); }
    function setInputLength(value: int): void { controller.setInputLength(value); }
    function replay(): void { controller.replay(); }
    LockSession {
        id: controller
        input: auth.input
        initialLength: 12
        transitionTime: root.transitionTime
        animationEnabled: root.animationEnabled
        onPreviewRequested: length => root.previewRequested(length)
        onPowerRequested: action => root.powerRequested(action)
    }
    LockHeader {
        id: header
        x: root.compact ? 20 : 32
        y: root.compact ? 22 : 27
        width: parent.width - x * 2
        height: implicitHeight
        compact: root.compact
        enabled: !controller.powerAction
    }
    Item {
        id: layout
        x: (parent.width - width) / 2
        y: header.y + header.height + (footer.y - header.y - header.height - height) / 2
        width: root.layoutWidth
        height: root.layoutHeight
        enabled: !controller.powerAction
        Item {
            id: title
            x: 0
            y: root.compact ? 0 : root.medium ? 15.7 : -42.4
            width: root.compact || root.medium ? parent.width : 112
            height: root.compact ? 151.6 : root.medium ? 58.6 : 624.8
            Rectangle {
                width: root.compact ? parent.width : 3
                height: root.compact ? 1 : parent.height
                y: root.compact ? parent.height - 1 : 0
                color: root.compact ? "#48433b" : "#d1161c"
            }
            LockText {
                x: root.compact ? 0 : 15
                y: 0
                text: root.medium ? "LINK" : "L\nI\nN\nK"
                width: root.medium ? implicitWidth : 90
                height: root.medium ? font.pixelSize : 540
                horizontalAlignment: root.medium ? Text.AlignLeft : Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
                font.family: "Oswald"
                font.pixelSize: root.compact ? 52 : root.medium ? 56 : 90
                font.letterSpacing: 2
                lineHeightMode: Text.FixedHeight
                lineHeight: root.medium ? font.pixelSize : 135
                color: "#e4e2dc"
            }
            LockText {
                x: root.compact ? 0 : root.medium ? 152 : 15
                y: root.compact ? 64 : root.medium ? 27 : 558
                text: "継衛"
                font.family: "Noto Sans CJK JP"
                font.pixelSize: root.compact ? 30 : 24
                font.letterSpacing: 5
                color: "#e4e2dc"
            }
            LockText {
                x: root.compact ? 0 : root.medium ? 232 : 15
                y: root.compact ? 115 : root.medium ? 40.5 : 607.2
                text: "SHŌI / 14"
            }
        }
        LockClock {
            id: clock
            x: root.compact ? 0 : root.medium ? 0 : 136
            y: root.compact ? 151.6 + 24 + root.artSide + 36.4 + 24 : root.medium ? 230 - implicitHeight - 18 : 260 - implicitHeight - 18
            width: root.compact ? parent.width : root.medium ? parent.width - 332 : parent.width - 160 - root.artSide
            height: implicitHeight
            compact: root.compact
            size: root.compact ? 48 : root.medium ? 52 : 64
        }
        Item {
            id: bay
            x: root.compact ? 0 : parent.width - width
            y: root.compact ? 175.6 : root.medium ? 90 + (380 - height) / 2 : (parent.height - height) / 2
            width: root.artSide
            height: width + (root.compact ? 36.4 : 40.4)
            LockArtwork { width: parent.width; height: width; phase: root.phase; emphasis: root.emphasis }
            Rectangle { y: parent.width + (root.compact ? 8 : 12); width: parent.width; height: 1; color: "#48433b" }
            LockText { y: parent.width + (root.compact ? 21 : 25); text: "A"; color: "#d1161c" }
            LockText { anchors.right: parent.right; y: parent.width + (root.compact ? 21 : 25); text: "RELAY TILES"; font.letterSpacing: 1 }
        }
        Item {
            x: root.compact ? 0 : root.medium ? 0 : 136
            y: root.compact ? clock.y + clock.height + 24 : root.medium ? 230 : 260
            width: Math.min(parent.width, 350)
            height: auth.height + (root.compact ? 19 : 22)
            Rectangle { visible: root.compact; width: parent.width; height: 1; color: "#48433b" }
            LockAuth {
                id: auth
                compact: root.compact
                y: root.compact ? 19 : 22
                width: parent.width; height: implicitHeight
                session: controller
            }
        }
    }
    LockFooter {
        id: footer
        x: root.compact ? 20 : 32; y: root.height - height - 24
        width: parent.width - x * 2; height: implicitHeight
        session: controller
        enabled: !controller.powerAction
    }
    LockOverlay { anchors.fill: parent; session: controller }
}
