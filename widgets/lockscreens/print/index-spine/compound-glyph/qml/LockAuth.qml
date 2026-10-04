// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic

Item {
    id: auth
    required property LockSession session
    property bool reactive: false
    property bool compact: false
    property bool inlineIdentity: false
    property bool paperLayout: false
    property color paper: "#e4e2dc"
    property color muted: "#99958b"
    property color line: "#48433b"
    property color ground: "#090909"
    property alias input: input
    readonly property real identityHeight: reactive ? 44.5 : inlineIdentity ? 18.2 : paperLayout ? 45.6 : 43.6
    readonly property real fieldY: reactive ? 89 : inlineIdentity ? 34.2 : identityHeight + (compact ? 44.4 : 49.4)
    implicitHeight: reactive ? 237.5 : fieldY + 44 + (inlineIdentity ? 22 : 24)

    Row {
        id: identityLabel
        y: 0
        spacing: 8
        LockText { text: "USER"; color: auth.muted; font.letterSpacing: 1.3 }
        LockText { visible: !auth.reactive; text: "//"; color: "#d1161c" }
        LockText { visible: !auth.reactive; text: "01"; color: auth.muted }
    }
    LockText {
        x: auth.inlineIdentity ? parent.width - implicitWidth : 0
        y: auth.inlineIdentity ? 0 : auth.reactive ? 20.5 : auth.paperLayout ? 27.4 : 25.4
        text: "silverhand9012"
        font.pixelSize: auth.reactive ? 16 : 13
        color: auth.paper
    }
    LockText {
        visible: !auth.inlineIdentity
        y: auth.fieldY - 24.4
        text: auth.reactive ? "DEMO PASSWORD" : "PASSWORD"
        font.letterSpacing: 1.1
        color: auth.muted
    }
    LockText {
        visible: !auth.inlineIdentity
        anchors.right: parent.right
        y: auth.fieldY - 24.4
        text: "本人確認"
        font.family: "Noto Sans CJK JP"
        font.pixelSize: 12
        color: auth.muted
    }
    Rectangle {
        id: field
        x: 0
        y: auth.fieldY
        width: auth.reactive ? parent.width : parent.width - 56
        height: 44
        color: "transparent"
        border.width: auth.reactive ? 1 : 0
        border.color: input.activeFocus ? auth.paper : "#66635c"
        Rectangle {
            visible: !auth.reactive
            width: parent.width; height: 1; anchors.bottom: parent.bottom
            color: input.activeFocus ? auth.paper : "#777267"
        }
        Rectangle {
            visible: input.activeFocus
            anchors.fill: parent; anchors.margins: -3
            color: "transparent"; border.color: auth.paper
        }
        LockText {
            visible: auth.reactive
            x: 13; anchors.verticalCenter: parent.verticalCenter
            text: "›"; font.pixelSize: 21; color: "#e53136"
        }
        TextField {
            id: input
            objectName: "demoInput"
            anchors.fill: parent
            anchors.leftMargin: auth.reactive ? 35 : auth.inlineIdentity ? 10 : 2
            anchors.rightMargin: auth.reactive || auth.inlineIdentity ? 10 : 2
            padding: 0
            font.family: "JetBrains Mono"
            font.pixelSize: 16
            font.letterSpacing: 4
            color: auth.paper
            selectionColor: "#d1161c"
            selectedTextColor: auth.paper
            echoMode: TextInput.Password
            passwordCharacter: "•"
            passwordMaskDelay: 0
            maximumLength: 64
            selectByMouse: true
            inputMethodHints: Qt.ImhSensitiveData | Qt.ImhNoPredictiveText | Qt.ImhNoAutoUppercase
            Accessible.name: "Demo password. Use dummy text to animate the artwork; Backspace reverses it."
            background: Item {}
            onTextEdited: auth.session.acceptInput()
            onInputMethodComposingChanged: { if (!inputMethodComposing) Qt.callLater(auth.session.acceptInput); }
            onAccepted: auth.session.replay()
            LockText {
                visible: !input.text.length && !input.inputMethodComposing
                anchors.verticalCenter: parent.verticalCenter
                width: parent.width
                color: auth.muted
                font.pixelSize: 12
                text: "Type dummy text…"
                elide: Text.ElideRight
            }
        }
    }
    LockText {
        objectName: "lockStatus"
        y: auth.fieldY + 53
        width: parent.width
        text: auth.session.status
        color: auth.muted
        font.letterSpacing: .7
        Accessible.name: text
    }
    LockButton {
        id: unlock
        objectName: "unlockPreview"
        x: auth.reactive ? 0 : parent.width - 44
        y: auth.reactive ? auth.fieldY + 79 : auth.fieldY
        width: auth.reactive ? parent.width : 44
        height: auth.reactive ? 40 : 44
        outlined: auth.reactive
        filled: !auth.reactive
        fullWidth: auth.reactive
        animationEnabled: auth.session.animationEnabled
        text: auth.reactive ? "UNLOCK" : ""
        paper: auth.paper
        ink: auth.paper
        Accessible.name: "Preview unlock animation"
        onClicked: auth.session.replay()
        Canvas {
            visible: auth.reactive
            width: 16; height: 16
            anchors.right: parent.right; anchors.rightMargin: 13
            anchors.verticalCenter: parent.verticalCenter
            onPaint: {
                const context = getContext("2d");
                context.reset();
                context.scale(16 / 24, 16 / 24);
                context.strokeStyle = auth.paper;
                context.lineWidth = 1.5;
                context.beginPath();
                context.moveTo(5, 19); context.lineTo(19, 5);
                context.moveTo(5, 5); context.lineTo(19, 5); context.lineTo(19, 19);
                context.stroke();
            }
        }
    }
    LockText { visible: auth.reactive; y: 221; text: "SESSION / 01"; color: auth.muted }
    LockText {
        visible: auth.reactive; y: 221; anchors.right: parent.right
        text: "セッションロック中"; font.family: "Noto Sans CJK JP"; color: auth.muted
    }
}
