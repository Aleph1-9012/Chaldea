// SPDX-License-Identifier: 0BSD
import QtQuick
import Quickshell.Services.Mpris

Item {
    id: backend
    visible: false
    property bool monitoring: true
    property string selectedName: ""
    readonly property var players: Mpris.players.values
    readonly property var player: {
        const chosen = players.find(p => p.dbusName === selectedName);
        return chosen || players.find(p => p.isPlaying) || players[0] || null;
    }
    readonly property string trackTitle: player ? player.trackTitle || "Untitled track" : "NO PLAYER"
    readonly property string artist: player ? player.trackArtist || "Unknown artist" : "Open a media player to begin"
    readonly property string album: player ? player.trackAlbum || "Unknown album" : "WAITING FOR AUDIO"
    readonly property string sourceName: player ? player.identity || "Media player" : "OFFLINE"
    readonly property string status: !player ? "IDLE" : player.isPlaying ? "PLAYING" : player.playbackState === MprisPlaybackState.Stopped ? "STOPPED" : "PAUSED"
    readonly property string trackNumber: {
        const n = player ? Number(player.metadata["xesam:trackNumber"]) : 0;
        return Number.isInteger(n) && n > 0 ? String(n).padStart(2, "0") : "--";
    }
    readonly property bool playing: !!player && player.isPlaying
    readonly property bool canPlay: !!player && player.canControl && (playing ? player.canPause : player.canPlay)
    readonly property bool canPrevious: !!player && player.canControl && player.canGoPrevious
    readonly property bool canNext: !!player && player.canControl && player.canGoNext
    readonly property real duration: player && player.lengthSupported && Number.isFinite(player.length) ? Math.max(0, player.length) : 0
    readonly property bool canSeek: !!player && player.canControl && player.canSeek && player.positionSupported && duration > 0
    property int clockTick: 0
    readonly property real position: {
        const tick = clockTick;
        const value = player && player.positionSupported ? player.position : 0;
        return Number.isFinite(value) ? Math.max(0, duration > 0 ? Math.min(duration, value) : value) : 0;
    }
    onPlayersChanged: {
        if (selectedName && !players.some(p => p.dbusName === selectedName)) selectedName = "";
    }
    function selectPlayer(name: string): void { selectedName = name; }
    function togglePlaying(): void {
        if (!canPlay) return;
        if (playing) player.pause(); else player.play();
    }
    function previous(): void { if (canPrevious) player.previous(); }
    function next(): void { if (canNext) player.next(); }
    function seekTo(seconds: real): void {
        if (canSeek && Number.isFinite(seconds)) player.position = Math.max(0, Math.min(duration, seconds));
    }
    function formatTime(seconds: real): string {
        const value = Math.max(0, Math.floor(seconds));
        return String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0");
    }
    Timer {
        interval: 500
        repeat: true
        running: backend.monitoring && backend.playing
        onTriggered: backend.clockTick = (backend.clockTick + 1) % 1000000
    }
}
