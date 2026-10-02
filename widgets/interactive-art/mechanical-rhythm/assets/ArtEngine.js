// SPDX-License-Identifier: 0BSD
// Original study logic and drawing, used by HTML and QML.
function makeRhythmWheel(driver) {
    const TAU = Math.PI * 2, pins = Array.from({ length: 12 }, (_, i) => [0, 3, 5, 7, 10].includes(i));
    let tempo = 92, selected = 0, position = -.015, sound = false, message = '5 pins set · sound off';
    let audio = null, master = null, dims = { w: 688, h: 410 }, voices = new Set();
    const impacts = Array(12).fill(0);
    const describe = () => {
        message = pins.filter(Boolean).length + ' pins set · sound ' + (sound ? 'on' : 'off');
    };

    function silence() {
        sound = false;

        if (driver) {
            driver.stop();
            describe();

            return;
        }

        if (master && audio)
            master.gain.setValueAtTime(0, audio.currentTime);

        for (const voice of voices) {
            try {
                voice.stop();
                voice.disconnect();
            }
            catch (_) {
            }
        }

        voices.clear();

        if (audio && audio.state === 'running')
            audio.suspend().catch(() => {
            });

        describe();
    }

    function strike(index) {
        impacts[index] = 1;

        if (driver) {
            if (sound)
                driver.strike(index);

            return;
        }

        if (!sound || !audio || audio.state !== 'running')
            return;

        const now = audio.currentTime, frequency = [220, 247, 277, 330, 370, 415][index % 6];

        for (const [ratio, level] of [[1, .10], [2.71, .026], [5.43, .009]]) {
            const oscillator = audio.createOscillator(), gain = audio.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency * ratio, now);
            gain.gain.setValueAtTime(.00001, now);
            gain.gain.exponentialRampToValueAtTime(level, now + .004);
            gain.gain.exponentialRampToValueAtTime(.00001, now + .23);
            oscillator.connect(gain);
            gain.connect(master);
            voices.add(oscillator);
            oscillator.onended = () => {
                voices.delete(oscillator);
                oscillator.disconnect();
                gain.disconnect();
            };

            oscillator.start(now);
            oscillator.stop(now + .25);
        }
    }

    function geometry() {
        const r = Math.min(dims.w * .30, dims.h * .30);

        return { x: dims.w * .5, y: dims.h * .48, r };
    }

    function toggle(index) {
        selected = index;
        pins[index] = !pins[index];
        describe();
    }

    return {
        controls: () => [
            { type: 'range', key: 'tempo', label: 'Tempo · ' + tempo + ' BPM', value: tempo, min: 40, max: 180, step: 1 },
            { type: 'select', key: 'step', label: 'Pin', value: String(selected), options: pins.map((on, i) => ({ value: String(i), label: String(i + 1).padStart(2, '0') + (on ? ' · set' : ' · empty') })) },
            { type: 'button', key: 'toggle', label: pins[selected] ? 'Remove pin' : 'Set pin', pressed: pins[selected] },
            { type: 'button', key: 'sound', label: sound ? 'Sound off' : 'Sound on', pressed: sound }
        ],
        status: () => message,
        action(key, value) {
            if (key === 'tempo') {
                tempo = Math.max(40, Math.min(180, Number(value) || 92));
                describe();
            }

            if (key === 'step')
                selected = Math.max(0, Math.min(11, Math.round(Number(value) || 0)));

            if (key === 'toggle')
                toggle(selected);

            if (key === 'sound') {
                if (sound) {
                    silence();

                    return;
                }

                if (driver) {
                    sound = driver.enable();
                    describe();

                    if (!sound)
                        message = 'Sound unavailable. Check the audio output.';

                    return;
                }

                const Constructor = globalThis.AudioContext || globalThis.webkitAudioContext;

                if (!Constructor) {
                    message = 'Sound unavailable in this preview';

                    return;
                }

                try {
                    if (!audio) {
                        audio = new Constructor();
                        master = audio.createGain();
                        master.gain.value = .26;
                        master.connect(audio.destination);
                    }

                    sound = true;
                    master.gain.setValueAtTime(.26, audio.currentTime);
                    describe();
                    audio.resume().then(() => {
                        if (!sound && audio.state === 'running')
                            audio.suspend().catch(() => {
                            });
                    }).catch(() => {
                        silence();
                        message = 'Sound could not start';
                    });
                }
                catch (_) {
                    silence();
                    message = 'Sound unavailable in this preview';
                }
            }
        },
        pointer(kind, x, y) {
            if (kind !== 'down')
                return;

            const g = geometry(), px = x * dims.w, py = y * dims.h;
            let nearest = -1, distance = Infinity;

            for (let i = 0; i < 12; i++) {
                const a = i / 12 * TAU - Math.PI / 2, d = Math.hypot(px - g.x - Math.cos(a) * g.r, py - g.y - Math.sin(a) * g.r);

                if (d < distance) {
                    nearest = i;
                    distance = d;
                }
            }

            if (distance < Math.min(23, g.r * .23))
                toggle(nearest);
        },
        update(dt) {
            dt = Math.max(0, Math.min(.5, Number(dt) || 0));

            for (let i = 0; i < 12; i++)
                impacts[i] = Math.max(0, impacts[i] - dt * 3.4);

            const next = position + dt * tempo / 60 * 3;

            for (let i = Math.floor(position) + 1; i <= Math.floor(next); i++) {
                const pin = ((i % 12) + 12) % 12;

                if (pins[pin])
                    strike(pin);
            }

            position = next % 12;
        },
        suspend: silence,
        draw(ctx, w, h) {
            dims = { w, h };
            const { x, y, r } = geometry(), a = position / 12 * TAU - Math.PI / 2;
            ctx.save();
            ctx.fillStyle = '#080808';
            ctx.fillRect(0, 0, w, h);
            ctx.translate(x, y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#42413e';

            for (const radius of [r * .19, r * .41, r * .76, r * .90, r, r * 1.12]) {
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, TAU);
                ctx.stroke();
            }

            for (let i = 0; i < 72; i++) {
                const ang = i / 72 * TAU, inner = r * (i % 6 === 0 ? 1.17 : 1.20), outer = r * 1.23;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner);
                ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer);
                ctx.strokeStyle = i % 6 === 0 ? '#87847c' : '#393936';
                ctx.stroke();
            }

            ctx.strokeStyle = '#222321';

            for (let i = 0; i < 6; i++) {
                const ang = i / 6 * TAU + a * .18;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * r * .20, Math.sin(ang) * r * .20);
                ctx.lineTo(Math.cos(ang) * r * .74, Math.sin(ang) * r * .74);
                ctx.stroke();
            }

            for (let i = 0; i < 12; i++) {
                const angle = i / 12 * TAU - Math.PI / 2, px = Math.cos(angle) * r, py = Math.sin(angle) * r;

                if (impacts[i] > 0) {
                    ctx.strokeStyle = 'rgba(232,228,216,' + impacts[i] * .65 + ')';
                    ctx.beginPath();
                    ctx.arc(px, py, 9 + (1 - impacts[i]) * 19, 0, TAU);
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(px, py, pins[i] ? 6 : 3.5, 0, TAU);
                ctx.fillStyle = pins[i] ? '#cc1515' : '#080808';
                ctx.fill();
                ctx.strokeStyle = pins[i] ? '#ed5b48' : '#77766e';
                ctx.stroke();

                if (i === selected) {
                    ctx.strokeStyle = '#e8e4d8';
                    ctx.beginPath();
                    ctx.arc(px, py, 11, angle + .3, angle + TAU - .3);
                    ctx.stroke();
                }

                ctx.fillStyle = '#b4b0a5';
                ctx.font = '11px "JetBrains Mono",monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(String(i + 1).padStart(2, '0'), Math.cos(angle) * r * 1.38, Math.sin(angle) * r * 1.38);
            }

            ctx.rotate(a);
            ctx.strokeStyle = '#e8e4d8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-r * .28, 0);
            ctx.lineTo(r * .96, 0);
            ctx.stroke();
            ctx.fillStyle = '#e8e4d8';
            ctx.fillRect(r * .86, -3, r * .14, 6);
            ctx.fillStyle = '#080808';
            ctx.beginPath();
            ctx.arc(0, 0, r * .11, 0, TAU);
            ctx.fill();
            ctx.strokeStyle = '#e8e4d8';
            ctx.stroke();
            ctx.fillStyle = '#cc1515';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, TAU);
            ctx.fill();
            ctx.restore();
            ctx.save();
            ctx.fillStyle = '#8d8c84';
            ctx.font = '11px "JetBrains Mono",monospace';
            ctx.textAlign = 'center';
            ctx.fillText('12 / MECHANICAL RHYTHM', w / 2, h - 17);
            ctx.restore();
        }
    };
}

function createArtEngine(driver) {
    const study = makeRhythmWheel(driver);
    let paused = false, time = 0, width = 700, height = 410;
    const settings = { compact: false };

    return {
        meta: { "style": "plate", "title": "MECHANICAL RHYTHM", "hint": "Place pins around the wheel. Sound starts off.", "brand": "TSUGUMORI // PLAY STUDIES", "fields": 2 },
        get paused() {
            return paused;
        },
        setPaused(value) {
            var _a;
            paused = value;

            if (paused)
                (_a = study.suspend) === null || _a === void 0 ? void 0 : _a.call(study);
        },
        controls: study.controls, status: study.status, archives: () => [],
        action(key, value) {
            study.action(key, value);
        },
        pointer(kind, x, y) {
            study.pointer(kind, x / width, y / height);
        },
        configure(value) {
            Object.assign(settings, value);
        },
        key() {
        }, needsMotion: () => true,
        render(ctx, w, h, elapsed) {
            width = w;
            height = h;
            const dt = paused ? 0 : Math.min(.06, Math.max(0, elapsed));

            if (dt) {
                time += dt;
                study.update(dt, time);
            }

            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#080808';
            ctx.fillRect(0, 0, w, h);
            study.draw(ctx, w, h, time);
        },
        suspend() {
            var _a;
            study.pointer('up', 0, 0);
            (_a = study.suspend) === null || _a === void 0 ? void 0 : _a.call(study);
        },
        inspect() {
            return { time, paused, controls: study.controls() };
        }
    };
}
