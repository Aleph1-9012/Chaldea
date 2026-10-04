// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick

Item {
    id: clock
    required property LockScreen screen
    property int size: 42
    property real tracking: -2
    property bool caption: false
    property bool japaneseCaption: true
    property bool inlineDate: false
    property int topGap: 0
    property int bottomGap: 8
    readonly property bool dateBeside: inlineDate && width >= time.width + date.naturalWidth + 10
    readonly property int dateSeparator: screen.dateText.indexOf("//")
    implicitHeight: Math.max(time.y + time.height + bottomGap + (dateBeside ? 0 : date.height), dateBeside ? date.height : 0)

    Row {
        id: heading
        visible: clock.caption
        spacing: 14
        Rectangle { width: 5; height: 5; anchors.verticalCenter: parent.verticalCenter; color: clock.screen.lightTheme ? "#151513" : "#d1161c" }
        LockText { text: "SESSION LOCKED"; font.letterSpacing: 1.4; color: clock.screen.mutedColor }
        LockText { visible: clock.japaneseCaption; text: "認証待機"; font.family: "Noto Sans CJK JP"; font.letterSpacing: 1.4; color: clock.screen.mutedColor }
    }
    Row {
        id: time
        y: (clock.caption ? heading.implicitHeight : 0) + clock.topGap
        height: clock.size * 1.05
        Repeater {
            model: [clock.screen.hours, ":", clock.screen.minutes]
            LockText {
                required property string modelData
                required property int index
                text: modelData
                color: index === 1 ? "#d1161c" : clock.screen.paperColor
                font.pixelSize: clock.size
                font.letterSpacing: clock.tracking
                height: time.height
                verticalAlignment: Text.AlignVCenter
                wrapMode: Text.NoWrap
            }
        }
    }
    Flow {
        id: date
        readonly property real naturalWidth: dateBefore.implicitWidth + (clock.dateSeparator < 0 ? 0 : dateMark.implicitWidth + dateAfter.implicitWidth + spacing * 2)
        x: clock.dateBeside ? Math.max(time.width + 10, clock.width - naturalWidth) : 0
        y: clock.dateBeside ? (time.height + clock.bottomGap - height) / 2 : time.y + time.height + clock.bottomGap
        width: clock.dateBeside ? Math.max(0, clock.width - x) : clock.width
        spacing: clock.inlineDate ? 0 : 4
        LockText { id: dateBefore; text: clock.dateSeparator < 0 ? clock.screen.dateText : clock.screen.dateText.slice(0, clock.dateSeparator); color: clock.screen.mutedColor; font.letterSpacing: clock.inlineDate ? 0 : .2 }
        LockText { id: dateMark; visible: clock.dateSeparator >= 0; text: "//"; color: "#d1161c"; font.letterSpacing: clock.inlineDate ? 0 : .2 }
        LockText { id: dateAfter; visible: clock.dateSeparator >= 0; text: clock.screen.dateText.slice(clock.dateSeparator + 2); color: clock.screen.mutedColor; font.letterSpacing: clock.inlineDate ? 0 : .2 }
    }
}
