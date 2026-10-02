// SPDX-License-Identifier: 0BSD
(() => {
    const root = document.getElementById('ts-glyph-lock-preview');
    const screen = root.querySelector('.ts-screen');
    const pass = root.querySelector('.ts-password');
    const feedback = root.querySelector('.ts-feedback');
    const unlock = root.querySelector('.ts-unlock');
    const glyphs = root.querySelector('.ts-glyphs');
    const state = { motion: true, travel: 100 };
    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const maxTrails = 8;
    const maxSegments = 25;
    const redPieces = [];
    let demoLength = 0;
    let glyphPhase = 0;
    let glyphMotion = null;
    let glyphFrame = null;
    let previewTimer = null;
    let composing = false;
    let compositionEcho = false;
    const greyField = document.createDocumentFragment();
    glyphBase().forEach(glyph => {
        const cell = document.createElement('span');
        cell.textContent = glyph;
        greyField.appendChild(cell);
    });

    const redLayer = document.createElement('div');
    redLayer.className = 'ts-red-layer';

    for (let trail = 0; trail < maxTrails; trail++) {
        for (let segment = 0; segment < maxSegments; segment++) {
            const node = document.createElement('span');
            node.className = segment === 0 ? 'ts-red-glyph ts-snake-head' : 'ts-red-glyph';
            redPieces.push({ node, trail, segment });
            redLayer.appendChild(node);
        }
    }

    const clampUnit = value => Math.max(0, Math.min(1, value));
    function drawTrace() {
        glyphTrace(glyphPhase).forEach((piece, index) => {
            const node = redPieces[index].node;
            node.textContent = piece.glyph;
            node.style.transform = `translate(${piece.x * 100}%, ${piece.y * 100}%)`;
            node.style.opacity = String(piece.opacity);
        });
    }

    // The initial trace is positioned before insertion, with no entrance animation.
    drawTrace();
    glyphs.appendChild(greyField);
    glyphs.appendChild(redLayer);
    function cancelGlyphFrame() {
        if (glyphFrame !== null)
            cancelAnimationFrame(glyphFrame);

        glyphFrame = null;
    }

    function sampleGlyphMotion(now) {
        if (!glyphMotion)
            return 1;

        const progress = clampUnit((now - glyphMotion.started) / glyphMotion.duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        glyphPhase = progress === 1 ? glyphMotion.to
            : glyphMotion.from + (glyphMotion.to - glyphMotion.from) * eased;

        return progress;
    }

    function finishGlyphMotion() {
        cancelGlyphFrame();
        glyphMotion = null;
        glyphPhase = demoLength;
        drawTrace();
    }

    function glyphTick(now) {
        glyphFrame = null;

        if (!root.isConnected) {
            glyphMotion = null;

            return;
        }

        const progress = sampleGlyphMotion(now);
        drawTrace();

        if (progress < 1)
            glyphFrame = requestAnimationFrame(glyphTick);
        else
            glyphMotion = null;
    }

    function animateGlyphToLength() {
        const now = performance.now();
        sampleGlyphMotion(now);
        cancelGlyphFrame();

        if (!state.motion || motionPreference.matches || Math.abs(glyphPhase - demoLength) < 0.000001) {
            finishGlyphMotion();

            return;
        }

        glyphMotion = { from: glyphPhase, to: demoLength, started: now, duration: state.travel };
        drawTrace();
        glyphFrame = requestAnimationFrame(glyphTick);
    }

    motionPreference.addEventListener('change', () => {
        if (motionPreference.matches)
            finishGlyphMotion();
    });

    function setStatus(message) {
        if (feedback.textContent !== message)
            feedback.textContent = message;
    }

    function restStatus() {
        screen.dataset.auth = demoLength ? 'entered' : 'empty';
        setStatus(demoLength ? 'READY TO UNLOCK' : 'TYPE TO ACTIVATE');
    }

    function endPreview() {
        if (previewTimer !== null)
            clearTimeout(previewTimer);

        previewTimer = null;
        screen.classList.remove('ts-previewing');
        unlock.disabled = false;
    }

    function render() {
        endPreview();
        screen.dataset.motion = state.motion ? 'on' : 'off';
        animateGlyphToLength();
        restStatus();
    }

    function acceptDemoInput() {
        // Use only the input length. Discard typed characters immediately and keep
        // placeholders in the field; neither characters nor their hashes set the trace.
        const length = Math.min(pass.value.length, 64);
        const start = Math.min(pass.selectionStart ?? length, length);
        const end = Math.min(pass.selectionEnd ?? start, length);
        const changed = length !== demoLength;
        pass.value = 'x'.repeat(length);
        pass.setSelectionRange(start, end);
        demoLength = length;
        endPreview();

        // Phase is the edited length, not a forward-only keypress counter. Removing
        // one character returns to the exact earlier geometry and fill, with no
        // displacement or animation reset when a composition echo repeats a length.
        if (changed)
            animateGlyphToLength();

        restStatus();
    }

    pass.addEventListener('compositionstart', () => {
        composing = true;
        compositionEcho = false;
    });

    pass.addEventListener('compositionend', () => {
        composing = false;
        acceptDemoInput();
        compositionEcho = true;
    });

    pass.addEventListener('input', event => {
        if (composing || event.isComposing)
            return;

        // Some browsers emit a final input after compositionend. Its characters have
        // already been replaced with placeholders, so avoid advancing twice.
        if (compositionEcho) {
            compositionEcho = false;

            if (pass.value === 'x'.repeat(demoLength)) {
                acceptDemoInput();

                return;
            }
        }

        acceptDemoInput();
    });

    pass.addEventListener('keydown', event => {
        if (!event.isComposing && !composing)
            compositionEcho = false;

        if (event.key === 'Enter' && !event.isComposing && !composing) {
            event.preventDefault();
            unlock.click();
        }
    });

    unlock.addEventListener('click', () => {
        if (!demoLength) {
            setStatus('TYPE DUMMY TEXT FIRST');
            pass.focus();

            return;
        }

        endPreview();
        finishGlyphMotion();
        unlock.disabled = true;
        screen.classList.add('ts-previewing');
        setStatus('UNLOCK PREVIEW');
        previewTimer = setTimeout(() => {
            endPreview();
            restStatus();
        }, state.motion ? 1500 : 800);
    });

    render();
    window.ChaldeaPreview.connect(settings => {
        Object.assign(state, settings);
        render();
    });
})();
