// SPDX-License-Identifier: 0BSD
// WebGL2 renderer for Stochastic ink. ArtEngine.js decides the scene; this draws it.
// Pass 1 splats every point as a Gaussian sized by its depth of field into a float ink buffer.
// Pass 2 turns ink density into color: paper where there is none, ink where it piles up.
function createInkRenderer(canvas) {
    var gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false });

    if (!gl)
        return null;

    var floatTarget = !!gl.getExtension('EXT_color_buffer_float');
    var data = inkPointData(), lineTexture = null, target = null, targetTexture = null, width = 0, height = 0;

    var pointVertex = '#version 300 es\n' +
        'precision highp float;\nprecision highp int;\nprecision highp sampler2D;\n' +
        'uniform sampler2D uLines;\nuniform mat4 uView, uProj;\nuniform vec2 uViewport;\n' +
        'uniform float uTime, uFocus, uAperture, uMinR, uMaxR, uLod, uInk, uKeep, uDrift;\n' +
        'in vec2 aCorner;\nin vec4 aPoint;\nin vec4 aRandom;\nout vec2 vCorner;\nout float vInk;\n' +
        INK_SHADER_CORE + '\n' +
        'void main() {\n' +
        '    int li = int(aPoint.x);\n' +
        '    vec4 h = texelFetch(uLines, ivec2(0, li), 0);\n' +
        '    vCorner = aCorner;\n' +
        '    vInk = 0.0;\n' +
        '    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);\n' +
        '    if (h.x < 0.5 || h.z < 0.002 || aPoint.w > uKeep) return;\n' +
        '    vec3 p = inkPoint(h, texelFetch(uLines, ivec2(1, li), 0), texelFetch(uLines, ivec2(2, li), 0), texelFetch(uLines, ivec2(3, li), 0), texelFetch(uLines, ivec2(4, li), 0), texelFetch(uLines, ivec2(5, li), 0), aPoint.y, aRandom.xyz, uTime, uDrift);\n' +
        '    vec4 v = uView * vec4(p, 1.0);\n' +
        '    float depth = -v.z;\n' +
        '    if (depth < 0.15) return;\n' +
        '    float r = clamp(uAperture * abs(depth - uFocus) / depth * uViewport.y, uMinR, uMaxR);\n' +
        '    // Blurred points are larger, so draw fewer of them and give each more ink.\n' +
        '    // Keep kept points closer together than their blur so defocused lines stay continuous.\n' +
        '    float lod = max(1.0, r / uLod);\n' +
        '    if (aRandom.w * lod > 1.0) return;\n' +
        '    vec4 clip = uProj * v;\n' +
        '    gl_Position = clip + vec4(aCorner * 1.6 * r * 2.0 / uViewport * clip.w, 0.0, 0.0);\n' +
        '    vCorner = aCorner * 1.6;\n' +
        '    vInk = uInk * h.z * h.w * lod / (uKeep * r * r);\n' +
        '}\n';

    var pointFragment = '#version 300 es\nprecision highp float;\n' +
        'uniform float uDensity;\nin vec2 vCorner;\nin float vInk;\nout vec4 outColor;\n' +
        'void main() {\n' +
        '    float d2 = dot(vCorner, vCorner);\n' +
        '    if (d2 > 2.56 || vInk <= 0.0) discard;\n' +
        '    float ink = vInk * exp(-d2);\n' +
        '    // Float buffers add density; 8-bit buffers multiply transmittance instead.\n' +
        '    outColor = uDensity > 0.5 ? vec4(ink, 0.0, 0.0, 1.0) : vec4(0.0, 0.0, 0.0, 1.0 - exp(-ink));\n' +
        '}\n';

    var compositeVertex = '#version 300 es\nprecision highp float;\n' +
        'void main() {\n' +
        '    vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);\n' +
        '    gl_Position = vec4(p, 0.0, 1.0);\n' +
        '}\n';

    var compositeFragment = '#version 300 es\nprecision highp float;\nprecision highp sampler2D;\n' +
        'uniform sampler2D uTarget;\nuniform float uDensity;\nuniform vec3 uPaper, uInkColor;\nout vec4 outColor;\n' +
        'void main() {\n' +
        '    float v = texelFetch(uTarget, ivec2(gl_FragCoord.xy), 0).r;\n' +
        '    float t = uDensity > 0.5 ? exp(-v) : v;\n' +
        '    outColor = vec4(mix(uInkColor, uPaper, t), 1.0);\n' +
        '}\n';

    function compile(type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            throw new Error(gl.getShaderInfoLog(shader) || 'Shader did not compile.');

        return shader;
    }

    function program(vs, fs) {
        var p = gl.createProgram();
        gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(p);

        if (!gl.getProgramParameter(p, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(p) || 'Shader program did not link.');

        var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);

        for (var i = 0; i < n; i++) {
            var name = gl.getActiveUniform(p, i).name;
            u[name] = gl.getUniformLocation(p, name);
        }

        return { id: p, u: u };
    }

    var points = program(pointVertex, pointFragment), composite = program(compositeVertex, compositeFragment);
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    function attribute(name, array, size, divisor) {
        var loc = gl.getAttribLocation(points.id, name), buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        gl.vertexAttribDivisor(loc, divisor);
    }

    attribute('aCorner', new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), 2, 0);
    attribute('aPoint', data.line, 4, 1);
    attribute('aRandom', data.random, 4, 1);
    gl.bindVertexArray(null);
    var empty = gl.createVertexArray();

    lineTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, lineTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, INK_TEXELS, INK_LINES);

    function resize(w, h) {
        if (w === width && h === height && target)
            return;

        width = w;
        height = h;

        if (targetTexture)
            gl.deleteTexture(targetTexture);

        if (target)
            gl.deleteFramebuffer(target);

        targetTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texStorage2D(gl.TEXTURE_2D, 1, floatTarget ? gl.RGBA16F : gl.RGBA8, w, h);
        target = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, target);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, targetTexture, 0);

        if (floatTarget && gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            floatTarget = false;
            width = 0;
            resize(w, h);
        }
    }

    function draw(engine) {
        var w = canvas.width, h = canvas.height;
        resize(w, h);
        var u = engine.frame(w, h);

        gl.bindTexture(gl.TEXTURE_2D, lineTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, INK_TEXELS, INK_LINES, gl.RGBA, gl.FLOAT, engine.table);

        gl.bindFramebuffer(gl.FRAMEBUFFER, target);
        gl.viewport(0, 0, w, h);
        gl.disable(gl.DEPTH_TEST);

        if (floatTarget) {
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE);
        }
        else {
            gl.clearColor(1, 1, 1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
        }

        gl.useProgram(points.id);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, lineTexture);
        var p = points.u;
        gl.uniform1i(p.uLines, 0);
        gl.uniformMatrix4fv(p.uView, false, engine.view);
        gl.uniformMatrix4fv(p.uProj, false, engine.proj);
        gl.uniform2f(p.uViewport, w, h);
        gl.uniform1f(p.uTime, u.time);
        gl.uniform1f(p.uFocus, u.focus);
        gl.uniform1f(p.uAperture, u.aperture);
        gl.uniform1f(p.uMinR, u.minRadius);
        gl.uniform1f(p.uMaxR, u.maxRadius);
        gl.uniform1f(p.uLod, u.lodArea);
        gl.uniform1f(p.uInk, u.inkScale);
        gl.uniform1f(p.uKeep, u.keep);
        gl.uniform1f(p.uDrift, u.drift);
        gl.uniform1f(p.uDensity, floatTarget ? 1 : 0);
        gl.bindVertexArray(vao);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, data.count);

        gl.disable(gl.BLEND);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.useProgram(composite.id);
        gl.bindTexture(gl.TEXTURE_2D, targetTexture);
        gl.uniform1i(composite.u.uTarget, 0);
        gl.uniform1f(composite.u.uDensity, floatTarget ? 1 : 0);
        gl.uniform3fv(composite.u.uPaper, u.paper);
        gl.uniform3fv(composite.u.uInkColor, u.ink);
        gl.bindVertexArray(empty);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);
    }

    return { draw: draw, floatTarget: function () { return floatTarget; }, lost: function () { return gl.isContextLost(); } };
}
