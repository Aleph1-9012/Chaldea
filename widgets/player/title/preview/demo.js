// SPDX-License-Identifier: 0BSD
(() => {
    const root = document.getElementById('tsugumori-player-studies');

    if (!root)
        return;

    const tracks = [
        { title: 'SIDONIA', artist: 'angela', album: 'KNIGHTS OF SIDONIA', length: 263 },
        { title: 'OUTER HULL', artist: 'Tsugumori archive', album: 'ORBITAL STUDIES / 02', length: 218 },
        { title: 'GARDES AT DAWN', artist: 'Tsugumori archive', album: 'ORBITAL STUDIES / 03', length: 307 },
        { title: 'THE LONG WAY HOME // ORBITAL ARCHIVE', artist: 'Tsugumori archive', album: 'HOMEBOUND / 04', length: 346 }
    ];

    const state = { design: 'E', track: 0, position: 84, playing: false };
    const design = { artwork: true, strongFrames: false };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const announcement = root.querySelector('[data-announcement]');
    const art = document.createElement('canvas');
    art.width = 640;
    art.height = 640;
    const ac = art.getContext('2d');
    let interval = null, lastTick = 0, inView = true, matrixFrame = 0;
    const pad = n => String(n).padStart(2, '0');
    const time = value => {
        const s = Math.max(0, Math.floor(value));

        return pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    };

    const say = text => {
        announcement.textContent = text;
    };

    function polygon(ctx, points, fill, stroke) {
        ctx.beginPath();
        points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = .8;
            ctx.stroke();
        }
    }

    function makeArtwork() {
        const c = ac, s = 640, index = state.track;
        c.clearRect(0, 0, s, s);
        c.fillStyle = '#111313';
        c.fillRect(0, 0, s, s);
        const bg = c.createRadialGradient(332, 250, 8, 335, 290, 450);
        bg.addColorStop(0, '#89968f');
        bg.addColorStop(.3, '#3b4641');
        bg.addColorStop(1, '#090b0b');
        c.fillStyle = bg;
        c.fillRect(0, 0, s, s);

        if (!design.artwork) {
            c.fillStyle = '#101010';
            c.fillRect(0, 0, s, s);
            c.fillStyle = '#54443c';
            c.font = '240px monospace';
            c.textAlign = 'center';
            c.fillText(pad(index + 1), 320, 368);
            c.font = '19px monospace';
            c.fillStyle = '#b9afa6';
            c.fillText('NO COVER ART', 320, 432);
            c.textAlign = 'left';

            return;
        }

        let seed = 17047 + index * 1943;
        const rand = () => {
            seed = (seed * 16807) % 2147483647;

            return (seed - 1) / 2147483646;
        };

        c.save();
        c.translate(322, 318);
        c.rotate((index - 1) * .075);
        c.translate(-322, -318);
        // A printed architectural study. Each plate converges on the open shaft.
        const van = { x: 340, y: 271 };

        for (let side = 0; side < 2; side++) {
            for (let k = 0; k < 18; k++) {
                const t = k / 18, n = (k + 1) / 18, depth = Math.pow(t, 1.7), next = Math.pow(n, 1.7);
                const x = side ? 640 - depth * 266 : depth * 292, nx = side ? 640 - next * 266 : next * 292;
                const top = side ? 15 + depth * 172 : -45 + depth * 242, nt = side ? 15 + next * 172 : -45 + next * 242;
                const bot = 640 - depth * 292, nb = 640 - next * 292;
                const shade = Math.round(42 + rand() * 50 + (1 - depth) * 18);
                polygon(c, [[x, top], [nx, nt], [nx, nb], [x, bot]], 'rgb(' + shade + ',' + (shade + 5) + ',' + (shade + 1) + ')', '#171d19');
                const inset = side ? -12 : 12;
                polygon(c, [[x, top], [x + inset, top + 7], [x + inset, bot - 12], [x, bot]], '#111715', '#58645a');

                for (let j = 1; j < 8; j++) {
                    const q = j / 8;
                    c.strokeStyle = 'rgba(201,208,189,.23)';
                    c.beginPath();
                    c.moveTo(x, top + (bot - top) * q);
                    c.lineTo(nx, nt + (nb - nt) * q);
                    c.stroke();
                }
            }
        }

        polygon(c, [[0, 640], [292, 348], [374, 348], [640, 640]], '#272d27');

        for (let j = 0; j < 14; j++) {
            const y = 350 + Math.pow(j / 13, 2) * 290;
            c.strokeStyle = '#596050';
            c.beginPath();
            c.moveTo(0, y);
            c.lineTo(640, y);
            c.stroke();
        }

        for (let j = 0; j < 9; j++) {
            c.strokeStyle = '#10150f';
            c.beginPath();
            c.moveTo(332, 345);
            c.lineTo(-80 + j * 105, 640);
            c.stroke();
        }

        c.fillStyle = '#0a100d';
        c.fillRect(292, 145, 84, 201);
        c.fillStyle = '#adb7a1';
        c.fillRect(302, 155, 4, 155);
        c.fillStyle = '#64705d';
        c.fillRect(362, 155, 3, 155);

        for (let j = 0; j < 10; j++) {
            const y = 156 + j * 15;
            c.fillStyle = j % 2 ? '#233029' : '#3b493c';
            c.fillRect(310, y, 44, 2);
        }

        // Red suspended equipment is the single color accent in the sample sleeve.
        polygon(c, [[311, 198], [344, 187], [364, 225], [349, 279], [324, 289], [303, 254]], '#a42520', '#cf6b50');
        polygon(c, [[311, 198], [328, 224], [324, 289], [303, 254]], '#521b18');
        polygon(c, [[328, 224], [364, 225], [349, 279], [324, 289]], '#7f2520');
        c.strokeStyle = '#d2c9b1';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(333, 0);
        c.lineTo(333, 192);
        c.stroke();
        c.restore();
        c.fillStyle = 'rgba(5,6,5,.50)';
        c.fillRect(0, 0, 640, 61);
        c.fillStyle = '#dedace';
        c.font = '16px monospace';
        c.fillText('TSUGUMORI / AUDIO ARCHIVE', 24, 37);
        c.font = '12px monospace';
        c.fillStyle = '#d0c4b0';
        c.fillText('STUDY ' + pad(index + 1) + '   //   SAMPLE ART', 24, 607);

        for (let n = 0; n < 9500; n++) {
            const x = rand() * 640, y = rand() * 640;
            c.fillStyle = rand() > .5 ? 'rgba(240,233,211,.10)' : 'rgba(0,0,0,.14)';
            c.fillRect(x, y, 1, 1);
        }
    }

    function renderArt() {
        makeArtwork();
        root.querySelectorAll('canvas[data-art]').forEach(canvas => {
            canvas.width = 640;
            canvas.height = 640;
            canvas.getContext('2d').drawImage(art, 0, 0);
        });

        drawMatrix();
    }

    function drawMatrix(scramble = 0) {
        const canvas = root.querySelector('[data-matrix]');

        if (!canvas)
            return;

        const c = canvas.getContext('2d');
        const pixels = ac.getImageData(0, 0, 640, 640).data;
        c.fillStyle = '#090909';
        c.fillRect(0, 0, 640, 640);
        c.font = '18px monospace';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const glyphs = ' .·:+x*#@';

        for (let row = 0; row < 32; row++)
            for (let col = 0; col < 32; col++) {
                const x = col * 20 + 10, y = row * 20 + 10, p = (y * 640 + x) * 4;
                const luminance = (pixels[p] * .3 + pixels[p + 1] * .59 + pixels[p + 2] * .11) / 255;
                const tone = Math.min(1, Math.max(0, (luminance - .025) / .47));
                const k = Math.min(glyphs.length - 1, Math.floor(Math.pow(tone, .65) * (glyphs.length - 1)));
                const hash = (row * 131 + col * 71 + state.track * 127 + Math.floor(scramble * 100));
                const char = scramble > 0 && hash % 7 < scramble * 7 ? '╱╲+·#'[hash % 5] : glyphs[k];
                const isRed = pixels[p] > pixels[p + 1] * 1.45 && pixels[p] > 65;
                c.fillStyle = isRed ? '#e13a2c' : `rgba(232,232,224,${.22 + Math.sqrt(tone) * .72})`;
                c.fillText(char, x, y);
            }
    }

    function settleMatrix() {
        cancelAnimationFrame(matrixFrame);
        matrixFrame = 0;

        if (reduced.matches || state.design !== 'A' || document.hidden || !inView) {
            drawMatrix();

            return;
        }

        const started = performance.now();
        let last = 0;
        const step = now => {
            if (!root.isConnected || document.hidden || !inView || state.design !== 'A') {
                matrixFrame = 0;
                drawMatrix();

                return;
            }

            const progress = Math.min(1, (now - started) / 380);

            if (now - last > 45 || progress === 1) {
                drawMatrix(1 - progress);
                last = now;
            }

            if (progress < 1)
                matrixFrame = requestAnimationFrame(step);
            else
                matrixFrame = 0;
        };

        matrixFrame = requestAnimationFrame(step);
    }

    function renderLibraries() {
        root.querySelectorAll('[data-library]').forEach(library => {
            tracks.forEach((track, i) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'ps-track';
                button.dataset.track = String(i);
                button.setAttribute('aria-pressed', String(i === state.track));
                const number = document.createElement('span');
                number.className = 'ps-track-number';
                number.textContent = pad(i + 1) + ' //';
                const copy = document.createElement('span');
                copy.className = 'ps-track-copy';
                const title = document.createElement('span');
                title.className = 'ps-track-title';
                title.textContent = track.title;
                const artist = document.createElement('span');
                artist.className = 'ps-track-artist';
                artist.textContent = track.artist;
                copy.append(title, artist);
                const length = document.createElement('span');
                length.className = 'ps-track-length';
                length.textContent = time(track.length);
                button.append(number, copy, length);
                library.append(button);
            });
        });
    }

    function render() {
        const track = tracks[state.track];
        const values = { title: track.title, artist: track.artist, album: track.album, index: pad(state.track + 1), elapsed: time(state.position), duration: time(track.length), status: state.playing ? 'PLAYING' : 'PAUSED', source: 'LOCAL' };
        root.querySelectorAll('[data-field]').forEach(el => {
            el.textContent = values[el.dataset.field] ?? '';
        });

        root.classList.toggle('ps-playing', state.playing);
        root.classList.toggle('ps-strong-frames', design.strongFrames);
        root.querySelectorAll('[data-action="play"]').forEach(el => {
            el.textContent = state.playing ? 'PAUSE' : 'PLAY';
            el.setAttribute('aria-label', state.playing ? 'Pause sample playback' : 'Play sample playback');
        });

        root.querySelectorAll('[data-seek]').forEach(el => {
            el.max = track.length;
            el.value = Math.floor(state.position);
            el.style.setProperty('--ps-progress', (state.position / track.length * 100) + '%');
            el.setAttribute('aria-valuetext', time(state.position) + ' of ' + time(track.length));
        });

        root.querySelectorAll('[data-track]').forEach(el => el.setAttribute('aria-pressed', String(Number(el.dataset.track) === state.track)));
    }

    function selectTrack(index, announce = true) {
        state.track = (index + tracks.length) % tracks.length;
        state.position = 0;
        renderArt();
        render();
        settleMatrix();

        if (announce)
            say(pad(state.track + 1) + ' // ' + tracks[state.track].title);
    }

    function stopClock() {
        if (interval !== null) {
            clearInterval(interval);
            interval = null;
        }
    }

    function syncClock() {
        stopClock();

        if (!state.playing || document.hidden || !inView || !root.isConnected)
            return;

        lastTick = performance.now();
        interval = setInterval(() => {
            if (!root.isConnected) {
                stopClock();

                return;
            }

            const now = performance.now();
            state.position += Math.min(1.5, (now - lastTick) / 1000);
            lastTick = now;

            if (state.position >= tracks[state.track].length)
                selectTrack(state.track + 1);
            else
                render();
        }, 250);
    }

    root.addEventListener('click', event => {
        const button = event.target.closest('button');

        if (!button || !root.contains(button))
            return;

        if (button.dataset.track !== undefined) {
            selectTrack(Number(button.dataset.track));

            return;
        }

        const action = button.dataset.action;

        if (action === 'play') {
            state.playing = !state.playing;
            render();
            syncClock();
            say(state.playing ? 'Sample playback playing. No audio.' : 'Sample playback paused.');
        }
        else if (action === 'next' || action === 'prev') {
            selectTrack(state.track + (action === 'next' ? 1 : -1));
            syncClock();
        }
        else if (action === 'library') {
            const panel = button.closest('[data-design]'), library = panel.querySelector('[data-library-panel]') || panel.querySelector('[data-library]');

            if (library) {
                library.hidden = !library.hidden;
                button.setAttribute('aria-expanded', String(!library.hidden));
                button.textContent = library.hidden ? 'TRACKS' : 'CLOSE TRACKS';
            }
        }
    });

    root.addEventListener('input', event => {
        if (event.target.matches('[data-seek]')) {
            state.position = Math.max(0, Math.min(tracks[state.track].length, Number(event.target.value)));
            lastTick = performance.now();
            render();
        }
    });

    root.addEventListener('change', event => {
        if (event.target.matches('[data-seek]'))
            say('Position ' + time(state.position));
    });

    document.addEventListener('visibilitychange', () => {
        syncClock();

        if (document.hidden) {
            cancelAnimationFrame(matrixFrame);
            matrixFrame = 0;
            drawMatrix();
        }
    });

    reduced.addEventListener('change', () => {
        cancelAnimationFrame(matrixFrame);
        matrixFrame = 0;
        drawMatrix();
    });

    if (globalThis.IntersectionObserver) {
        const observer = new IntersectionObserver(entries => {
            inView = entries[0].isIntersecting;
            syncClock();

            if (!inView) {
                cancelAnimationFrame(matrixFrame);
                matrixFrame = 0;
                drawMatrix();
            }
        }, { threshold: 0 });

        observer.observe(root);
    }

    renderLibraries();
    renderArt();
    render();
    announcement.textContent = '';
    window.ChaldeaPreview.connect(settings => {
        const artworkChanged = design.artwork !== settings.s0Artwork;
        design.artwork = settings.s0Artwork;
        design.strongFrames = settings.s1StrongFrames;

        if (artworkChanged)
            renderArt();

        render();
    });
})();
