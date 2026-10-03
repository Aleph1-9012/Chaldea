// SPDX-License-Identifier: 0BSD
// Stochastic ink, Qt Quick 3D fragment stage. Each point is a soft Gaussian disc of ink.
// Blending is "over" with one ink color, so the result is the same in any drawing order:
// paper where no ink lands, ink where it piles up.
VARYING vec2 vCorner;
VARYING float vInk;

void MAIN() {
    float d2 = dot(vCorner, vCorner);
    if (d2 > 2.56 || vInk <= 0.0)
        discard;
    float a = 1.0 - exp(-vInk * exp(-d2));
    // Dither by under one 8-bit step, so faint defocused ink survives rounding on average.
    float n = fract(sin(dot(vCorner, vec2(12.9898, 78.233)) + vInk * 917.0) * 43758.5453);
    a = clamp(a + (n - 0.5) / 255.0, 0.0, 1.0);
    FRAGCOLOR = vec4(uInkColor, a);
}
