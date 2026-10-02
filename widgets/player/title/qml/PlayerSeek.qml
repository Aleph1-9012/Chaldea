// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic
import QtQuick.Layouts

ColumnLayout {
    id: seek
    required property PlayerBackend backend
    property bool ruler: false
    spacing: 0
    implicitHeight: (ruler ? 10 : 0) + 44
    Row {
        visible: seek.ruler
        Layout.fillWidth: true
        Layout.preferredHeight: 8
        spacing: (width - 33) / 32
        Repeater {
            model: 33
            Rectangle {
                required property int index
                width: 1
                height: index % 5 === 0 ? 8 : 5
                color: "#68605a"
            }
        }
    }
    Slider {
        id: slider
        Layout.fillWidth: true
        implicitHeight: 28
        from: 0
        to: Math.max(1, seek.backend.duration)
        enabled: seek.backend.canSeek
        stepSize: 1
        live: true
        value: Math.min(seek.backend.position, to)
        Accessible.name: "Seek track"
        Accessible.description: seek.backend.formatTime(value) + " of " + seek.backend.formatTime(seek.backend.duration)
        onMoved: seek.backend.seekTo(value)
        background: Rectangle {
            x: slider.leftPadding
            y: slider.topPadding + slider.availableHeight / 2 - height / 2
            width: slider.availableWidth
            height: 3
            color: "#403a36"
            Rectangle { width: parent.width * slider.visualPosition; height: parent.height; color: "#cc1515" }
        }
        handle: Rectangle {
            x: slider.leftPadding + slider.visualPosition * (slider.availableWidth - width)
            y: slider.topPadding + slider.availableHeight / 2 - height / 2
            width: 9
            height: 13
            color: slider.enabled ? "#e8e8e8" : "#68605a"
            border.width: slider.visualFocus ? 2 : 0
            border.color: "#cc1515"
        }
    }
    RowLayout {
        Layout.fillWidth: true
        PlayerText { text: seek.backend.formatTime(seek.backend.position) }
        Item { Layout.fillWidth: true }
        PlayerText { text: seek.backend.duration > 0 ? seek.backend.formatTime(seek.backend.duration) : "--:--"; color: "#a09b96" }
    }
}
