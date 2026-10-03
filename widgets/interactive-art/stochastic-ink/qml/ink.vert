// SPDX-License-Identifier: 0BSD
// Stochastic ink, Qt Quick 3D vertex stage. Every instance of a small quad is one point of ink.
// The block between the CORE markers is INK_SHADER_CORE from ArtEngine.js, copied verbatim, and the
// layout in inkLayout() follows INK_GROUPS. Change them together.
VARYING vec2 vCorner;
VARYING float vInk;

// CORE BEGIN
uvec3 inkPcg(uvec3 v) {
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    v ^= v >> 16u;
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    return v;
}
vec3 inkHash(vec3 c) {
    uvec3 h = inkPcg(uvec3(ivec3(c) + 8192));
    return vec3(h >> 8u) * (2.0 / 16777216.0) - 1.0;
}
// Vector value noise in [-1, 1], smooth in all three components.
vec3 inkNoise(vec3 p) {
    vec3 i = floor(p), f = p - i, u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec3 a = mix(inkHash(i), inkHash(i + vec3(1.0, 0.0, 0.0)), u.x);
    vec3 b = mix(inkHash(i + vec3(0.0, 1.0, 0.0)), inkHash(i + vec3(1.0, 1.0, 0.0)), u.x);
    vec3 c = mix(inkHash(i + vec3(0.0, 0.0, 1.0)), inkHash(i + vec3(1.0, 0.0, 1.0)), u.x);
    vec3 d = mix(inkHash(i + vec3(0.0, 1.0, 1.0)), inkHash(i + vec3(1.0, 1.0, 1.0)), u.x);
    return mix(mix(a, b, u.y), mix(c, d, u.y), u.z);
}
// One point of line li at parameter s, before noise. prof scales the noise along the line.
vec3 inkCurve(vec4 h, vec4 c, vec4 A, vec4 B, vec4 C, float extra, float s, vec3 rnd, out float prof) {
    prof = 1.0;
    if (h.x < 1.5) {
        // Ray from the core: straight, bent, and gently waved. Noise grows toward the tip.
        prof = 0.12 + 0.88 * s;
        return c.xyz + A.xyz * (c.w * s) + B.xyz * (c.w * A.w * s * s) + C.xyz * (c.w * B.w * s * sin(s * C.w + h.y));
    }
    if (h.x < 2.5) {
        // Closed loop: rose, Lissajous, or torus knot.
        float th = 6.2831853 * s;
        vec3 q;
        if (h.y < 0.5) { float r = cos(A.w * th); q = vec3(r * cos(th), r * sin(th), B.w * sin(2.0 * th)); }
        else if (h.y < 1.5) q = vec3(sin(A.w * th + 0.6), sin(B.w * th), 0.55 * sin(C.w * th + 1.1));
        else { float r = 0.62 + 0.3 * cos(B.w * th); q = vec3(r * cos(A.w * th), r * sin(A.w * th), 0.36 * sin(B.w * th)); }
        return c.xyz + c.w * (A.xyz * q.x + B.xyz * q.y + C.xyz * q.z);
    }
    if (h.x < 3.5) {
        // Arc of a shell around the core.
        float ph = A.w + B.w * s;
        return c.xyz + c.w * (A.xyz * cos(ph) + B.xyz * sin(ph) + C.xyz * (C.w * sin(ph * 2.0 + h.y)));
    }
    if (h.x < 4.5) {
        // Cloud of ink dust: denser toward its center.
        float z = rnd.x * 2.0 - 1.0, a = 6.2831853 * rnd.y, r = sqrt(max(0.0, 1.0 - z * z));
        float rad = c.w * sqrt(-log(1.0 - 0.985 * rnd.z)) * 0.55;
        return c.xyz + vec3(r * cos(a), r * sin(a), z) * rad;
    }
    // Sheet: a bulging, twisting patch drawn as rows of parallel strands, combed like fabric.
    // Nets also draw some strands across the rows, which reads as a wing-like lattice.
    // Points come in contiguous runs, one run per strand, so every strand is evenly sampled.
    float u, v, rows = C.w, net = B.w;
    if (s < 1.0 - net) { float t = s / (1.0 - net) * rows; v = (floor(t) + 0.5) / rows; u = fract(t); }
    else { float cols = max(1.0, floor(rows * 0.6)), t = (s - 1.0 + net) / net * cols; u = (floor(t) + 0.5) / cols; v = fract(t); }
    float tw = h.y * (u - 0.5), cu = u - 0.5, cv = v - 0.5;
    vec3 side = B.xyz * cos(tw) + C.xyz * sin(tw);
    // Pinched at the core end and spread toward the tip, like a fan.
    return c.xyz + c.w * (A.xyz * cu + side * (extra * cv * (0.15 + 1.7 * u)) + C.xyz * (A.w * (cu * cu * 4.0 + cv * cv * 2.0 - 1.0)));
}
// A finished point: the curve, then chaos (three octaves of noise, mostly across the line
// so ink crinkles instead of bunching into beads), then a slow drift shared by everything.
vec3 inkPoint(vec4 h, vec4 c, vec4 A, vec4 B, vec4 C, vec4 n, float s, vec3 rnd, float time, float drift) {
    float prof, unused;
    vec3 p = inkCurve(h, c, A, B, C, n.w, s, rnd, prof);
    vec3 q = p * n.y + vec3(n.z, n.z * 1.7, n.z * 2.3) + vec3(0.0, 0.0, time * 1.3);
    vec3 d = inkNoise(q) + 0.5 * inkNoise(q * 2.13 + 11.7) + 0.3 * inkNoise(q * 4.71 - 5.3);
    if (h.x < 3.5) {
        vec3 t = inkCurve(h, c, A, B, C, n.w, s + 0.003, rnd, unused) - p;
        float l = length(t);
        if (l > 1e-6) { t /= l; d -= t * (dot(d, t) * 0.8); }
    }
    p += d * (n.x * prof);
    return p + inkNoise(p * 0.85 + vec3(time * 0.06, 3.1, 7.7)) * drift;
}
// CORE END

// Which line a point belongs to, and where along it, for INK_GROUPS (250880 points in all).
void inkLayout(int i, out int li, out float s) {
    int start, first, per;
    if (i < 12288) { start = 0; first = 0; per = 512; } // cloud
    else if (i < 36864) { start = 12288; first = 24; per = 2048; } // loop
    else if (i < 77824) { start = 36864; first = 36; per = 1024; } // arc
    else if (i < 143360) { start = 77824; first = 76; per = 4096; } // sheet
    else { start = 143360; first = 92; per = 768; } // ray
    int k = i - start;
    li = first + k / per;
    s = (float(k - (k / per) * per) + 0.5) / float(per);
}

void MAIN() {
    vCorner = vec2(0.0);
    vInk = 0.0;
    POSITION = vec4(2.0, 2.0, 2.0, 1.0);
    int li;
    float s;
    inkLayout(INSTANCE_INDEX, li, s);
    // Per-point random numbers, derived from the instance so no per-point buffer is needed.
    vec3 ra = vec3(inkPcg(uvec3(uint(INSTANCE_INDEX), 7u, 13u)) >> 8u) / 16777216.0;
    vec3 rnd = vec3(inkPcg(uvec3(uint(INSTANCE_INDEX), 101u, 57u)) >> 8u) / 16777216.0;
    vec4 h = texelFetch(uLines, ivec2(0, li), 0);
    if (h.x < 0.5 || h.z < 0.002 || ra.x > uKeep)
        return;
    vec3 p = inkPoint(h, texelFetch(uLines, ivec2(1, li), 0), texelFetch(uLines, ivec2(2, li), 0), texelFetch(uLines, ivec2(3, li), 0), texelFetch(uLines, ivec2(4, li), 0), texelFetch(uLines, ivec2(5, li), 0), s, rnd, uTime, uDrift);
    float depth = dot(p - CAMERA_POSITION, CAMERA_DIRECTION);
    if (depth < 0.15)
        return;
    // Depth of field: each point grows with its distance from the focal plane.
    float r = clamp(uAperture * abs(depth - uFocus) / depth * uViewport.y, uMinR, uMaxR);
    // Blurred points are larger, so draw fewer of them and give each more ink.
    float lod = max(1.0, r / uLod);
    if (ra.y * lod > 1.0)
        return;
    vec4 clip = VIEWPROJECTION_MATRIX * vec4(p, 1.0);
    vec2 corner = sign(VERTEX.xy);
    POSITION = clip + vec4(corner * (1.6 * r * 2.0) / uViewport * clip.w, 0.0, 0.0);
    vCorner = corner * 1.6;
    vInk = uInk * h.z * h.w * lod / (uKeep * r * r);
}
