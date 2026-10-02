// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls.Basic
import QtQuick.Layouts
ColumnLayout {
    id: field
    required property var control
    property color ink: "#16151a"
    property color paper: "#f6f5f2"
    readonly property color dim: Qt.rgba(ink.r, ink.g, ink.b, .6)
    readonly property color line: Qt.rgba(ink.r, ink.g, ink.b, .16)
    readonly property color wash: Qt.rgba(ink.r, ink.g, ink.b, .04)
    property string fontFamily: "JetBrains Mono"
    signal edited(string key, var value)
    spacing: 6
    RowLayout {
        Layout.fillWidth: true
        InkText { text: field.control.label; color: field.dim; font.family: field.fontFamily; font.pixelSize: 11; font.letterSpacing: 1; Layout.fillWidth: true }
        InkText { text: field.control.type === "range" ? String(Math.round(Number(field.control.value))) : ""; color: field.ink; font.family: field.fontFamily; font.pixelSize: 11 }
    }
    Loader {
        Layout.fillWidth: true
        sourceComponent: field.control.type === "select" ? selectControl : rangeControl
    }
    Component {
        id: rangeControl
        Slider {
            id: slider
            objectName: "control-" + field.control.key
            from: field.control.min
            to: field.control.max
            stepSize: field.control.step || 1
            value: Math.max(from, Math.min(to, Number(field.control.value)))
            implicitHeight: 28
            Accessible.name: field.control.label
            onMoved: field.edited(field.control.key, value)
            background: Rectangle {
                x: slider.leftPadding; y: slider.topPadding + slider.availableHeight / 2 - 1
                width: slider.availableWidth; height: 2; color: field.line
                Rectangle { height: parent.height; width: slider.visualPosition * parent.width; color: field.ink }
            }
            handle: Rectangle {
                x: slider.leftPadding + slider.visualPosition * (slider.availableWidth - width)
                y: slider.topPadding + slider.availableHeight / 2 - height / 2
                width: 12; height: 12; radius: 6
                color: slider.pressed ? field.ink : field.paper
                border.color: field.ink
                border.width: slider.visualFocus ? 3 : 1.5
            }
        }
    }
    Component {
        id: selectControl
        ComboBox {
            id: select
            objectName: "control-" + field.control.key
            model: field.control.options
            textRole: "label"
            valueRole: "value"
            currentIndex: field.control.options.findIndex(option => String(option.value) === String(field.control.value))
            implicitHeight: 36
            font.family: field.fontFamily
            font.pixelSize: 12
            font.letterSpacing: 1
            Accessible.name: field.control.label
            indicator: InkText { text: "⌄"; color: field.ink; width: 18; height: 18; x: select.width - 24; y: (select.height - height) / 2 - 3; font.pixelSize: 16; horizontalAlignment: Text.AlignHCenter }
            onActivated: field.edited(field.control.key, currentValue)
            background: Rectangle { color: field.wash; border.color: select.visualFocus ? field.ink : field.line; border.width: select.visualFocus ? 2 : 1 }
            contentItem: InkText {
                leftPadding: 9; rightPadding: 24
                text: select.displayText
                font: select.font
                color: field.ink
                verticalAlignment: Text.AlignVCenter
                maximumLineCount: 1; elide: Text.ElideRight
            }
            delegate: ItemDelegate {
                id: option
                required property var modelData
                width: select.width
                text: modelData.label
                contentItem: InkText { text: option.text; font: select.font; color: option.highlighted ? field.paper : field.ink; maximumLineCount: 1; elide: Text.ElideRight }
                background: Rectangle { color: option.highlighted ? field.ink : field.paper }
            }
            popup: Popup {
                y: select.height
                width: select.width
                padding: 1
                implicitHeight: Math.min(260, contentItem.implicitHeight + 2)
                contentItem: ListView { clip: true; implicitHeight: contentHeight; model: select.delegateModel; currentIndex: select.highlightedIndex; ScrollIndicator.vertical: ScrollIndicator {} }
                background: Rectangle { color: field.paper; border.color: field.line }
            }
        }
    }
}
