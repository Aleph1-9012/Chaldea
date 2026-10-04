// SPDX-License-Identifier: 0BSD
import QtQuick
import QtQuick.Controls.Basic

Item {
    id: auth
    required property LockScreen screen
    property bool wordButton: false
    property alias input: input
    implicitHeight: 66
    function focusInput(): void { input.forceActiveFocus(Qt.OtherFocusReason); }
    function setInputLength(length: int): void {
        input.text = "x".repeat(Math.max(0, Math.min(64, length)));
        input.cursorPosition = input.text.length;
        acceptInput();
    }
    function acceptInput(): void {
        if (input.inputMethodComposing) return;
        const length = Math.min(input.text.length, 64);
        const start = Math.min(input.selectionStart, length);
        const end = Math.min(input.selectionEnd, length);
        const cursor = Math.min(input.cursorPosition, length);
        const masked = "x".repeat(length);
        if (input.text !== masked) {
            input.text = masked;
            if (start !== end) input.select(cursor === start ? end : start, cursor === start ? start : end);
            else input.cursorPosition = cursor;
        }
        screen.inputChanged(length);
    }
    Item {
        width: Math.max(0, auth.width - unlock.width - (auth.wordButton ? 14 : 12))
        height: 44
        Rectangle { width: parent.width; height: 1; anchors.bottom: parent.bottom; color: input.activeFocus ? "#e4e2dc" : "#777166" }
        TextField {
            id: input
            objectName: "demoInput"
            anchors.fill: parent; anchors.leftMargin: 2; anchors.rightMargin: 2
            padding: 0
            color: "#e4e2dc"
            selectionColor: "#d1161c"
            selectedTextColor: "#e4e2dc"
            font.family: "JetBrains Mono"
            font.pixelSize: 16
            font.letterSpacing: 3
            echoMode: TextInput.Password
            passwordCharacter: "•"
            passwordMaskDelay: 0
            maximumLength: 64
            selectByMouse: true
            inputMethodHints: Qt.ImhSensitiveData | Qt.ImhNoPredictiveText | Qt.ImhNoAutoUppercase
            background: Item {}
            Accessible.name: "Demo password. Use dummy text only. No authentication takes place."
            onTextEdited: auth.acceptInput()
            onInputMethodComposingChanged: { if (!inputMethodComposing) Qt.callLater(auth.acceptInput); }
            onAccepted: auth.screen.replay()
            Keys.onEscapePressed: event => {
                if (!inputMethodComposing) { auth.setInputLength(0); event.accepted = true; }
            }
            LockText {
                visible: !input.text.length && !input.inputMethodComposing
                width: parent.width
                anchors.verticalCenter: parent.verticalCenter
                font.pixelSize: 12
                text: "Type dummy text…"
                maximumLineCount: 1
                elide: Text.ElideRight
            }
        }
    }
    LockButton {
        id: unlock
        objectName: "unlockPreview"
        anchors.right: parent.right
        width: auth.wordButton ? 105 : 44
        height: 44
        text: auth.wordButton ? "UNLOCK" : ""
        solid: true
        arrow: true
        padding: auth.wordButton ? 8 : 14
        animationEnabled: auth.screen.animationEnabled
        Accessible.name: "Preview unlock"
        onClicked: auth.screen.replay()
    }
    LockText {
        objectName: "lockStatus"
        y: 44
        width: parent.width
        height: 22
        topPadding: 7
        text: auth.screen.statusText
        Accessible.role: Accessible.StaticText
        Accessible.name: text
    }
}
