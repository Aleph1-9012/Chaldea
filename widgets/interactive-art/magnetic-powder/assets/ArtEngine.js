// SPDX-License-Identifier: 0BSD
// Original study logic and drawing, used by HTML and QML.
function makeMagnetic() {
    const magnets = [{ x: .32, y: .45, p: 1 }, { x: .69, y: .58, p: -1 }, { x: .52, y: .25, p: 1 }];
    let count = 2, selected = 0, drag = false, filings = [], seed = 2, w = 0, h = 0, shake = 0, message = 'Drag either magnet beneath the filings.';
    const rand = n => {
        const k = Math.sin(n * 127.1 + seed * 24.9) * 43758.54;

        return k - Math.floor(k);
    };

    function populate() {
        filings = [];
        const nx = w < 400 ? 31 : 55, ny = 29;

        for (let y = 0; y < ny; y++)
            for (let x = 0; x < nx; x++) {
                const i = y * nx + x;
                filings.push({ x: .045 + (x + .2 + rand(i) * .6) / nx * .91, y: .075 + (y + .2 + rand(i + 1900) * .6) / ny * .85, angle: rand(i + 80) * Math.PI, noise: rand(i + 700) * 2 - 1 });
            }
    }

    function field(x, y) {
        let fx = 0, fy = 0;

        for (let i = 0; i < count; i++) {
            const m = magnets[i], dx = x - m.x, dy = (y - m.y) * h / w, d2 = dx * dx + dy * dy + .004, force = m.p / Math.pow(d2, 1.25);
            fx += dx * force;
            fy += dy * force;
        }

        return [fx, fy];
    }

    const api = {
        controls: () => [{ type: 'select', key: 'magnet', label: 'MAGNET', value: String(selected), options: Array.from({ length: count }, (_, i) => ({ value: String(i), label: '0' + (i + 1) })) }, { type: 'range', key: 'x', label: 'X POSITION', value: Math.round(magnets[selected].x * 100), min: 12, max: 88, step: 1 }, { type: 'range', key: 'y', label: 'Y POSITION', value: Math.round(magnets[selected].y * 100), min: 15, max: 85, step: 1 }, { type: 'button', key: 'polarity', label: magnets[selected].p > 0 ? 'POLE: N' : 'POLE: S' }, { type: 'button', key: 'third', label: count === 2 ? 'ADD MAGNET' : 'REMOVE 03', pressed: count === 3 }, { type: 'button', key: 'shake', label: 'SHAKE' }],
        action(key, value) {
            if (key === 'magnet')
                selected = Number(value);

            if (key === 'x')
                magnets[selected].x = Number(value) / 100;

            if (key === 'y')
                magnets[selected].y = Number(value) / 100;

            if (key === 'polarity')
                magnets[selected].p *= -1;

            if (key === 'third') {
                count = count === 2 ? 3 : 2;
                selected = Math.min(selected, count - 1);
            }

            if (key === 'shake') {
                seed++;
                populate();
                shake = 1;
            }

            message = key === 'shake' ? 'Filings scattered. The field gathers them again.' : 'Magnet 0' + (selected + 1) + ' / ' + (magnets[selected].p > 0 ? 'north' : 'south') + ' pole.';
        },
        update(dt) {
            shake = Math.max(0, shake - dt * .6);
            filings.forEach(p => {
                const f = field(p.x, p.y), angle = Math.atan2(f[1], f[0]) + p.noise * shake * 2, d = Math.atan2(Math.sin((angle - p.angle) * 2), Math.cos((angle - p.angle) * 2)) / 2;
                p.angle += d * Math.min(1, dt * 7);
            });
        },
        draw(ctx, W, H) {
            if (W !== w || H !== h) {
                w = W;
                h = H;
                populate();
                api.update(1);
            }

            ctx.save();
            ctx.strokeStyle = '#33312d';
            ctx.lineWidth = .8;
            ctx.strokeRect(w * .025, h * .05, w * .95, h * .9);
            ctx.lineCap = 'round';

            for (const p of filings) {
                let near = Infinity;

                for (let i = 0; i < count; i++)
                    near = Math.min(near, Math.hypot((p.x - magnets[i].x) * w, (p.y - magnets[i].y) * h));

                if (near < 23)
                    continue;

                const length = (w < 400 ? 3.8 : 5.6) * (1 + Math.exp(-near / 70) * .7), nx = Math.cos(p.angle) * length, ny = Math.sin(p.angle) * length, x = p.x * w, y = p.y * h;
                ctx.strokeStyle = 'rgba(232,228,216,' + (.37 + .35 * Math.exp(-near / 140)) + ')';
                ctx.beginPath();
                ctx.moveTo(x - nx, y - ny);
                ctx.lineTo(x + nx, y + ny);
                ctx.stroke();
            }

            magnets.slice(0, count).forEach((m, i) => {
                const x = m.x * w, y = m.y * h;
                ctx.beginPath();
                ctx.arc(x, y, 18, 0, Math.PI * 2);
                ctx.fillStyle = m.p > 0 ? '#cc1515' : '#151515';
                ctx.fill();
                ctx.strokeStyle = i === selected ? '#e8e4d8' : '#cc1515';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = '#e8e4d8';
                ctx.font = '12px "JetBrains Mono",monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(m.p > 0 ? 'N' : 'S', x, y);
            });

            ctx.restore();
        },
        pointer(kind, x, y) {
            if (kind === 'down') {
                let near = 45;

                for (let i = 0; i < count; i++) {
                    const d = Math.hypot((x - magnets[i].x) * w, (y - magnets[i].y) * h);

                    if (d < near) {
                        selected = i;
                        near = d;
                        drag = true;
                    }
                }
            }

            if (kind === 'move' && drag) {
                magnets[selected].x = Math.max(.12, Math.min(.88, x));
                magnets[selected].y = Math.max(.15, Math.min(.85, y));
            }

            if (kind === 'up' || kind === 'leave') {
                if (drag)
                    message = 'Magnet 0' + (selected + 1) + ' repositioned.';

                drag = false;
            }
        },
        status: () => message
    };

    return api;
}

function createArtEngine(driver) {
    const study = makeMagnetic();
    let paused = false, time = 0, width = 700, height = 410;
    const settings = { compact: false };

    return {
        meta: { "style": "plate", "title": "MAGNETIC POWDER", "hint": "Drag a pole across the plate. Flip polarity or add a third magnet.", "brand": "TSUGUMORI // PLAY STUDIES", "fields": 3 },
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

            if (paused)
                study.update(.033);
        },
        pointer(kind, x, y) {
            study.pointer(kind, x / width, y / height);

            if (paused && kind === 'move')
                study.update(.033);
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
