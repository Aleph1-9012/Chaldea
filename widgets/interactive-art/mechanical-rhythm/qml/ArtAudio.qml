// SPDX-License-Identifier: 0BSD
import QtQuick
import QtMultimedia

QtObject {
    id: bank
    property bool muted: false
    property bool enabled: false
    property MediaDevices devices: MediaDevices {}
    property list<SoundEffect> tones: [
        SoundEffect { source: "sounds/0.wav"; muted: bank.muted },
        SoundEffect { source: "sounds/1.wav"; muted: bank.muted },
        SoundEffect { source: "sounds/2.wav"; muted: bank.muted },
        SoundEffect { source: "sounds/3.wav"; muted: bank.muted },
        SoundEffect { source: "sounds/4.wav"; muted: bank.muted },
        SoundEffect { source: "sounds/5.wav"; muted: bank.muted }
    ]
    function enable(): bool {
        enabled = devices.audioOutputs.length > 0 && tones.every(tone => tone.status === SoundEffect.Ready);
        return enabled;
    }
    function strike(index: int): void {
        if (enabled) tones[index % 6].play();
    }
    function stop(): void {
        enabled = false;
        for (const tone of tones) tone.stop();
    }
    Component.onDestruction: stop()
}
