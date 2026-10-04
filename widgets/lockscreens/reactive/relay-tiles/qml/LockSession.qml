// SPDX-License-Identifier: 0BSD
import QtQuick

Item {
    id: session
    required property TextInput input
    property int initialLength: 0
    property int transitionTime: 100
    property bool animationEnabled: true
    property bool reactive: false
    property int length: initialLength
    property real phase: initialLength
    property bool previewing: false
    property string status: reactive ? "TYPE TO ACTIVATE" : ""
    property string powerAction: ""
    property Item previousFocus
    property bool initialized: false
    signal previewRequested(int length)
    signal powerRequested(string action)

    function restStatus(): void {
        status = reactive ? length ? "READY TO UNLOCK" : "TYPE TO ACTIVATE" : "";
    }
    function endPreview(): void {
        previewTimer.stop();
        previewing = false;
    }
    function retarget(): void {
        if (!initialized) return;
        travel.stop();
        const distance = Math.abs(phase - length);
        if (!animationEnabled || !visible || distance < .00001) {
            phase = length;
            return;
        }
        travel.from = phase;
        travel.to = length;
        travel.duration = Math.min(700, transitionTime * Math.max(1, Math.sqrt(distance)));
        travel.start();
    }
    function acceptInput(): void {
        if (input.inputMethodComposing) return;
        const next = Math.min(input.text.length, 64);
        const start = Math.min(input.selectionStart, next);
        const end = Math.min(input.selectionEnd, next);
        const cursor = Math.min(input.cursorPosition, next);
        const masked = "x".repeat(next);
        if (input.text !== masked) {
            input.text = masked;
            if (start !== end) input.select(cursor === start ? end : start, cursor === start ? start : end);
            else input.cursorPosition = cursor;
        }
        const changed = length !== next;
        length = next;
        endPreview();
        if (changed) retarget();
        restStatus();
    }
    function setInputLength(value: int): void {
        input.text = "x".repeat(Math.max(0, Math.min(64, value)));
        input.cursorPosition = input.text.length;
        acceptInput();
    }
    function focusInput(): void { input.forceActiveFocus(Qt.OtherFocusReason); }
    function replay(): void {
        if (input.inputMethodComposing || powerAction) return;
        if (!length) {
            status = reactive ? "ENTER DUMMY TEXT FIRST" : "USE DUMMY TEXT";
            focusInput();
            return;
        }
        endPreview();
        previewing = true;
        status = "PREVIEW ONLY";
        previewTimer.start();
        previewRequested(length);
    }
    function openPower(action: string, source: Item): void {
        endPreview();
        restStatus();
        previousFocus = source;
        powerAction = action;
        powerRequested(action);
    }
    function closePower(): void {
        powerAction = "";
        if (previousFocus) previousFocus.forceActiveFocus(Qt.OtherFocusReason);
        else focusInput();
    }
    onAnimationEnabledChanged: retarget()
    onTransitionTimeChanged: retarget()
    onVisibleChanged: {
        if (initialized && !visible) {
            travel.stop();
            phase = length;
            endPreview();
            restStatus();
            powerAction = "";
        }
    }
    Component.onCompleted: {
        input.text = "x".repeat(initialLength);
        input.cursorPosition = initialLength;
        initialized = true;
        restStatus();
    }
    NumberAnimation {
        id: travel
        target: session
        property: "phase"
        easing.type: Easing.OutCubic
    }
    Timer {
        id: previewTimer
        interval: 1100
        onTriggered: { session.previewing = false; session.restStatus(); }
    }
}
