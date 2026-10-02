// SPDX-License-Identifier: 0BSD
pragma ComponentBehavior: Bound
import QtQuick
import QtQuick.Controls.Basic
import QtQuick.Layouts
ColumnLayout {
    id: field
    required property var control
    property color accent: "#cc1515"
    property string fontFamily: "JetBrains Mono"
    signal edited(string key, var value)
    function focusInput(): void { const input = controlLoader.item as Item; if (input) input.forceActiveFocus(Qt.OtherFocusReason); }
    spacing: 6
    RowLayout {
        Layout.fillWidth: true
        ArtText { text: field.control.label; color: "#a0a0a0"; font.family: field.fontFamily; font.pixelSize: 11; Layout.fillWidth: true }
        ArtText { text: field.control.output || (field.control.type === "range" ? String(Math.round(Number(field.control.value))) : ""); font.family: field.fontFamily; font.pixelSize: 11 }
    }
    Loader {
        id: controlLoader
        Layout.fillWidth: true
        sourceComponent: field.control.type === "select" ? selectControl : field.control.type === "text" ? textControl : rangeControl
    }
    Rectangle {
        visible: field.control.quality !== undefined
        Layout.fillWidth: true
        implicitHeight: 2
        color: "#292020"
        Rectangle { height: parent.height; width: parent.width * (field.control.quality || 0) / 100; color: field.accent }
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
            implicitHeight: 30
            Accessible.name: field.control.label
            onMoved: field.edited(field.control.key, value)
            background: Rectangle {
                x: slider.leftPadding; y: slider.topPadding + slider.availableHeight / 2 - 2
                width: slider.availableWidth; height: 4; color: "#343330"
                Rectangle { height: parent.height; width: slider.visualPosition * parent.width; color: field.accent }
            }
            handle: Rectangle {
                x: slider.leftPadding + slider.visualPosition * (slider.availableWidth - width)
                y: slider.topPadding + slider.availableHeight / 2 - height / 2
                width: 12; height: 12; radius: 6
                color: field.accent
                border.color: slider.visualFocus ? "#e8e8e8" : field.accent
                border.width: slider.visualFocus ? 2 : 1
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
            implicitHeight: 38
            font.family: field.fontFamily
            font.pixelSize: 12
            Accessible.name: field.control.label
            indicator: ArtText { text: "⌄"; width: 18; height: 18; x: select.width - 24; y: (select.height - height) / 2; font.pixelSize: 16; horizontalAlignment: Text.AlignHCenter }
            onActivated: field.edited(field.control.key, currentValue)
            background: Rectangle { color: "#101010"; border.color: select.visualFocus ? "#e8e8e8" : "#492020" }
            contentItem: ArtText {
                leftPadding: 9; rightPadding: 24
                text: select.displayText
                font: select.font
                verticalAlignment: Text.AlignVCenter
                maximumLineCount: 1; elide: Text.ElideRight
            }
            delegate: ItemDelegate {
                id: option
                required property var modelData
                width: select.width
                text: modelData.label
                contentItem: ArtText { text: option.text; maximumLineCount: 2; elide: Text.ElideRight }
                background: Rectangle { color: option.highlighted ? field.accent : "#151515" }
            }
            popup: Popup {
                y: select.height
                width: select.width
                padding: 1
                implicitHeight: Math.min(260, contentItem.implicitHeight + 2)
                contentItem: ListView { clip: true; implicitHeight: contentHeight; model: select.delegateModel; currentIndex: select.highlightedIndex; ScrollIndicator.vertical: ScrollIndicator {} }
                background: Rectangle { color: "#151515"; border.color: "#492020" }
            }
        }
    }
    Component {
        id: textControl
        TextField {
            id: input
            objectName: "control-" + field.control.key
            text: String(field.control.value)
            maximumLength: field.control.maxLength || 32
            implicitHeight: 38
            color: "#e8e8e8"
            font.family: field.fontFamily; font.pixelSize: 14
            selectByMouse: true
            Accessible.name: field.control.label
            background: Rectangle { color: "#0a0a0a"; border.color: input.activeFocus ? "#e8e8e8" : "#492020" }
            onTextEdited: field.edited(field.control.key, text)
        }
    }
}
