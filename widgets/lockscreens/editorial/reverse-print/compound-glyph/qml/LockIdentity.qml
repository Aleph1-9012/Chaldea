// SPDX-License-Identifier: 0BSD
import QtQuick

Item {
    id: identity
    required property LockScreen screen
    property bool inlineName: false
    property bool lightText: false
    property int nameSize: 13
    property int nameTopGap: 6
    property int nameBottomGap: screen.narrow ? 0 : 6
    implicitHeight: inlineName ? Math.max(label.implicitHeight, user.implicitHeight) : label.implicitHeight + nameTopGap + user.implicitHeight + nameBottomGap
    Row {
        id: label
        spacing: 8
        LockText { text: "USER"; color: identity.lightText ? "#a09f94" : identity.screen.mutedColor; font.letterSpacing: 1 }
        LockText { text: "//"; color: "#d1161c"; font.letterSpacing: 1 }
        LockText { text: "01"; color: identity.lightText ? "#a09f94" : identity.screen.mutedColor; font.letterSpacing: 1 }
    }
    LockText {
        id: user
        x: identity.inlineName ? Math.max(label.implicitWidth + 12, identity.width - implicitWidth) : 0
        y: identity.inlineName ? 0 : label.implicitHeight + identity.nameTopGap
        width: Math.max(0, identity.width - x)
        text: identity.screen.userName
        font.pixelSize: identity.nameSize
        font.letterSpacing: .3
        color: identity.lightText ? "#e4e2dc" : identity.screen.paperColor
    }
}
