// SPDX-License-Identifier: 0BSD
// The original school simulation and skeletal drawing are shared by HTML and QML.
function createArtEngine() {
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    const angleDifference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
    const approach = (value, target, rate, dt) => value + (target - value) * (1 - Math.exp(-rate * dt));
    // Bend the backbone with the delayed heading of each body section. Integrating
    // its tangents preserves length, including through a turn back on itself.
    function createSpine(fish) {
        const step = .02, points = [[0, 0, 0]];
        // A small wave starts behind the head and grows toward the tail.
        const sway = u => .12 * Math.sin(u * 3.9) + (.045 + .055 * u + .10 * u * u) * Math.sin(u * 5.4 - fish.phase);

        for (let i = 1; i <= 68; i++) {
            const u = i * step, joint = (u - step / 2) / 1.36 * (fish.bodyHeadings.length - 1);
            const index = Math.floor(joint), fraction = joint - index;
            const angle = fish.bodyHeadings[index] + angleDifference(fish.bodyHeadings[index + 1], fish.bodyHeadings[index]) * fraction - fish.heading;
            const dx = step * 2.8, dy = sway(u) - sway(u - step), previous = points[i - 1];
            points.push([previous[0] + dx * Math.cos(angle) - dy * Math.sin(angle),
                previous[1] + dx * Math.sin(angle) + dy * Math.cos(angle), .055 * Math.sin(u * 6.2 - fish.phase) * u]);
        }

        function sample(u) {
            const position = clamp(u / step, 0, points.length - 1), index = Math.min(Math.floor(position), points.length - 2);
            const fraction = position - index;

            return points[index].map((value, axis) => value + (points[index + 1][axis] - value) * fraction);
        }

        const center = sample(.47), centerSway = sway(.47);

        return u => {
            const point = sample(u);

            return [point[0] - center[0], point[1] - center[1] + centerSway, point[2]];
        };
    }

    // Overlapping circles cover the flexing body, sails, and forked tail, with a
    // little water around them. A center-only radius misses head/tail crossings.
    function bodyEnvelope(fish, unit, bodyFit) {
        const spine = createSpine(fish), size = unit * fish.scale * bodyFit;
        const c = Math.cos(fish.heading + Math.PI), s = Math.sin(fish.heading + Math.PI);

        return [[0, .14], [.15, .30], [.3, .52], [.45, .62], [.6, .62], [.75, .55], [.9, .34], [1.08, .30], [1.25, .45]].map(([u, radius]) => {
            const p = spine(u);

            return { x: fish.x + (p[0] * c - p[1] * s) * size, y: fish.y + (p[0] * s + p[1] * c) * size, radius: radius * size + unit * .015 };
        });
    }

    function closestGap(a, b) {
        let closest = { gap: Infinity, x: 0, y: 1 };

        for (const p of a)
            for (const q of b) {
                const dx = p.x - q.x, dy = p.y - q.y, distance = Math.hypot(dx, dy);
                const gap = distance - p.radius - q.radius;

                if (gap < closest.gap)
                    closest = { gap, x: distance > .001 ? dx / distance : 0, y: distance > .001 ? dy / distance : 1 };
            }

        return closest;
    }

    function createSchool(width, height) {
        let seed = 704;
        const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
        const school = {
            width, height, time: 0, gathered: false,
            get unit() {
                return Math.min(this.width * .92, this.height * .78);
            },
            get bodyFit() {
                return Math.min(1, this.width / (this.unit * 1.65));
            },
            fish: [
                { x: width * .35, y: height * .38, heading: -.18, pace: .075, phase: .8, scale: .18 },
                { x: width * .65, y: height * .64, heading: Math.PI + .12, pace: .063, phase: 3.6, scale: .17 },
            ].map((fish, index) => (Object.assign(Object.assign({}, fish), { index, bodyHeadings: Array(9).fill(fish.heading), speed: 0, turn: 0, edgeSide: 0, burst: 0, target: null, destination: null, wanderUntil: 0, trail: [], trailTime: 0 }))),
            attract(x, y) {
                this.gathered = false;
                assignTargets(x, y);

                for (const fish of this.fish)
                    fish.burst = 1;
            },
            setGathered(value) {
                this.gathered = value;

                for (const fish of this.fish) {
                    fish.target = null;
                    fish.destination = null;
                }

                if (value)
                    assignTargets(this.width * .5, this.height * .52);
            },
            resize(nextWidth, nextHeight) {
                const sx = nextWidth / this.width, sy = nextHeight / this.height;

                for (const fish of this.fish) {
                    fish.x *= sx;
                    fish.y *= sy;
                    fish.heading = Math.atan2(Math.sin(fish.heading) * sy, Math.cos(fish.heading) * sx);
                    fish.bodyHeadings = fish.bodyHeadings.map(heading => Math.atan2(Math.sin(heading) * sy, Math.cos(heading) * sx));
                    fish.edgeSide = 0;

                    for (const point of [fish.target, fish.destination, ...fish.trail]) {
                        if (point) {
                            point.x *= sx;
                            point.y *= sy;
                        }
                    }
                }

                const oldUnit = this.unit;
                this.width = nextWidth;
                this.height = nextHeight;

                for (const fish of this.fish)
                    fish.speed *= this.unit / oldUnit;

                keepClear();
            },
            step(elapsed) {
                // Short substeps keep turns consistent across refresh rates and slow frames.
                let remaining = clamp(elapsed, 0, .1);

                while (remaining > .000001) {
                    const dt = Math.min(remaining, 1 / 120);
                    this.time += dt;
                    const avoidance = avoidEachOther();

                    for (const fish of this.fish)
                        swim(fish, dt, avoidance[fish.index]);

                    keepClear();
                    remaining -= dt;
                }
            },
        };

        function assignTargets(x, y) {
            // Arrive on opposite sides of the click instead of competing for one spot.
            // Place the pair across their approach, so they can arrive side by side.
            const dx = x - (school.fish[0].x + school.fish[1].x) / 2;
            const dy = y - (school.fish[0].y + school.fish[1].y) / 2;
            const horizontal = school.width >= school.unit * 1.2 && (Math.abs(dy) > Math.abs(dx) || school.height < school.unit * 1.2);
            const spacing = school.unit * .30;
            const margin = school.unit * .30;
            const center = {
                x: clamp(x, margin + (horizontal ? spacing : 0), school.width - margin - (horizontal ? spacing : 0)),
                y: clamp(y, margin + (horizontal ? 0 : spacing), school.height - margin - (horizontal ? 0 : spacing)),
            };

            const axis = horizontal ? 'x' : 'y';
            const first = school.fish[0][axis] <= school.fish[1][axis] ? 0 : 1;

            for (const fish of school.fish) {
                fish.target = Object.assign(Object.assign({}, center), { [axis]: center[axis] + (fish.index === first ? -spacing : spacing) });
                fish.destination = null;
            }
        }

        function envelopes() {
            return school.fish.map(fish => bodyEnvelope(fish, school.unit, school.bodyFit));
        }

        function avoidEachOther() {
            const bodies = envelopes(), current = closestGap(bodies[0], bodies[1]);
            const future = bodies.map((body, index) => {
                const fish = school.fish[index], ahead = 1.3;

                return body.map(p => (Object.assign(Object.assign({}, p), { x: p.x + Math.cos(fish.heading) * fish.speed * ahead, y: p.y + Math.sin(fish.heading) * fish.speed * ahead })));
            });

            const predicted = closestGap(future[0], future[1]);
            // Prediction controls when to react, not the side to pass on. Using the
            // predicted normal can flip it after the projected bodies cross.
            const nearby = Object.assign(Object.assign({}, current), { gap: Math.min(predicted.gap, current.gap) });
            const pressure = clamp(1 - nearby.gap / (school.unit * .30), 0, 1);

            return school.fish.map((fish, index) => {
                const sign = index === 0 ? 1 : -1, nx = nearby.x * sign, ny = nearby.y * sign;
                const closing = Math.max(0, -Math.cos(fish.heading) * nx - Math.sin(fish.heading) * ny);

                // Both pass on the same side of their own approach, avoiding indecision
                // when meeting head-on. Slow slightly while making room to turn.
                return { x: (nx - ny * .85) * pressure * pressure * 3.8, y: (ny + nx * .85) * pressure * pressure * 3.8, brake: pressure * closing };
            });
        }

        function contain(fish, body) {
            const padding = school.unit * .025;
            const minX = Math.min(...body.map(p => p.x - p.radius)), maxX = Math.max(...body.map(p => p.x + p.radius));
            const minY = Math.min(...body.map(p => p.y - p.radius)), maxY = Math.max(...body.map(p => p.y + p.radius));
            fish.x += Math.max(0, padding - minX) - Math.max(0, maxX - school.width + padding);
            fish.y += Math.max(0, padding - minY) - Math.max(0, maxY - school.height + padding);
        }

        function keepClear() {
            // Steering does most of the work. Resolve the remaining fraction of a
            // frame's contact, including a tail sweeping sideways during a turn.
            for (let pass = 0; pass < 12; pass++) {
                const before = envelopes();
                school.fish.forEach((fish, index) => contain(fish, before[index]));
                const bodies = envelopes(), contact = closestGap(bodies[0], bodies[1]);

                if (contact.gap >= 0)
                    break;

                const correction = (-contact.gap + .01) / 2;

                for (const fish of school.fish) {
                    const sign = fish.index === 0 ? 1 : -1;
                    fish.x += (contact.x - contact.y * .25) * correction * sign;
                    fish.y += (contact.y + contact.x * .25) * correction * sign;
                }
            }
        }

        function inside(x, y) {
            const margin = school.unit * .30;

            return { x: clamp(x, margin, school.width - margin), y: clamp(y, margin, school.height - margin) };
        }

        function chooseDestination(fish) {
            if (school.gathered) {
                fish.destination = inside(school.width * .5 + (random() - .5) * school.unit * .35, school.height * .52 + (random() - .5) * school.unit * .3);
            }
            else {
                const direction = fish.heading + (random() - .5) * 1.5;
                const distance = school.unit * (.7 + random() * .55);
                fish.destination = inside(fish.x + Math.cos(direction) * distance, fish.y + Math.sin(direction) * distance);

                if (Math.hypot(fish.destination.x - fish.x, fish.destination.y - fish.y) < school.unit * .25) {
                    fish.destination = inside(school.width * (.3 + random() * .4), school.height * (.3 + random() * .4));
                }
            }

            fish.wanderUntil = school.time + 8 + random() * 7;
        }

        function swim(fish, dt, avoidance) {
            const unit = school.unit, cruise = unit * fish.pace;
            const head = bodyEnvelope(fish, unit, school.bodyFit)[0];

            if (fish.target && Math.min(Math.hypot(fish.target.x - fish.x, fish.target.y - fish.y), Math.hypot(fish.target.x - head.x, fish.target.y - head.y)) < unit * .16) {
                fish.target = null;
                fish.destination = null;
            }

            if (!fish.destination || (!fish.target && (school.time > fish.wanderUntil || Math.hypot(fish.destination.x - fish.x, fish.destination.y - fish.y) < unit * .14)))
                chooseDestination(fish);

            const goal = fish.target || fish.destination;
            const dx = goal.x - fish.x, dy = goal.y - fish.y, distance = Math.max(1, Math.hypot(dx, dy));
            // Reserve room for the tail to sweep through a turn, then look ahead by
            // the distance needed to slow the current approach. Narrow scenes use
            // their actual, smaller body size rather than desktop margins.
            const margin = unit * (fish.scale * school.bodyFit * 2.6 + .04);
            const lookAhead = Math.max(unit * .28, fish.speed * 1.7);
            const futureX = fish.x + Math.cos(fish.heading) * lookAhead;
            const futureY = fish.y + Math.sin(fish.heading) * lookAhead;
            const inwardX = clamp((margin - futureX) / margin, 0, 1) - clamp((futureX - school.width + margin) / margin, 0, 1);
            const inwardY = clamp((margin - futureY) / margin, 0, 1) - clamp((futureY - school.height + margin) / margin, 0, 1);
            const edgePressure = Math.hypot(inwardX, inwardY);
            const approachingEdge = Math.max(0, -Math.cos(fish.heading) * inwardX - Math.sin(fish.heading) * inwardY);

            if (edgePressure < .04)
                fish.edgeSide = 0;
            else if (!fish.edgeSide) {
                const space = -inwardY * (school.width / 2 - fish.x) + inwardX * (school.height / 2 - fish.y);
                fish.edgeSide = Math.abs(space) > unit * .01 ? Math.sign(space) : fish.index === 0 ? 1 : -1;
            }

            // A tangent gives a head-on approach a clear way around the wall. Keep
            // that side through the turn so tiny heading changes cannot reverse it.
            const tangentX = -inwardY * fish.edgeSide * 1.5, tangentY = inwardX * fish.edgeSide * 1.5;
            const outward = edgePressure > 0 ? Math.min(0, (avoidance.x * inwardX + avoidance.y * inwardY) / edgePressure ** 2) * clamp(edgePressure * 3, 0, 1) : 0;
            const desired = Math.atan2(dy / distance + inwardY * 3 + tangentY + avoidance.y - outward * inwardY, dx / distance + inwardX * 3 + tangentX + avoidance.x - outward * inwardX);
            const difference = angleDifference(desired, fish.heading);
            const turningLimit = fish.target || avoidance.brake > .1 || edgePressure > .12 ? 1.05 : .55;
            const wantedTurn = clamp(difference * 1.8, -turningLimit, turningLimit);
            const easedTurn = approach(fish.turn, wantedTurn, 3.2, dt);
            fish.turn += clamp(easedTurn - fish.turn, -1.35 * dt, 1.35 * dt);
            fish.heading += fish.turn * dt;
            fish.bodyHeadings[0] = fish.heading;
            // The head commits first; each successive section follows its neighbour.
            // A quicker stroke carries that bend through the tail a little sooner.
            const follow = 10 + 2 * clamp(fish.speed / cruise - 1, 0, 1);

            for (let i = 1; i < fish.bodyHeadings.length; i++) {
                fish.bodyHeadings[i] += angleDifference(fish.bodyHeadings[i - 1], fish.bodyHeadings[i]) * (1 - Math.exp(-follow * dt));
            }

            fish.burst *= Math.exp(-dt / .32);
            const arrival = fish.target ? clamp(distance / (unit * .45), .55, 1) : 1;
            const edgePace = 1 - clamp(approachingEdge * 1.5, 0, .7);
            const wantedSpeed = (cruise * (fish.target ? 1.55 * arrival : 1) + unit * .13 * fish.burst) * (1 - avoidance.brake * .45) * edgePace;
            fish.speed = approach(fish.speed, wantedSpeed, fish.burst > .2 ? 10 : approachingEdge > .15 ? 4 : 2.5, dt);
            fish.x += Math.cos(fish.heading) * fish.speed * dt;
            fish.y += Math.sin(fish.heading) * fish.speed * dt;
            fish.phase += dt * (1.05 + fish.index * .19 + .35 * fish.speed / cruise + fish.burst * .7);
            fish.trailTime += dt;

            if (fish.trailTime >= .075) {
                fish.trailTime -= .075;
                const tail = createSpine(fish)(1.3), size = unit * fish.scale * school.bodyFit;
                const c = Math.cos(fish.heading + Math.PI), s = Math.sin(fish.heading + Math.PI);
                fish.trail.push({ x: fish.x + (tail[0] * c - tail[1] * s) * size, y: fish.y + (tail[0] * s + tail[1] * c) * size, time: school.time });
            }

            while (fish.trail.length && school.time - fish.trail[0].time > 1.2)
                fish.trail.shift();
        }

        for (const fish of school.fish) {
            fish.speed = school.unit * fish.pace;
            chooseDestination(fish);
        }

        keepClear();

        return school;
    }

    function drawSpaceFish(ctx, width, height, school, options) {
        const t = school.time;
        const detail = options.detail;
        const unit = school.unit, TAU = Math.PI * 2;
        const rand = n => {
            const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;

            return v - Math.floor(v);
        };

        ctx.save();
        ctx.fillStyle = '#050607';
        ctx.fillRect(0, 0, width, height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < Math.round(76 * detail); i++) {
            const x = rand(i + 2) * width, y = rand(i + 192) * height;
            ctx.fillStyle = `rgba(195,204,211,${.055 + rand(i + 64) * .22})`;
            const r = .35 + rand(i + 710) * .6;
            ctx.fillRect(x, y, r, r);
        }

        if (options.trails)
            for (const fish of school.fish)
                for (const point of fish.trail) {
                    const life = 1 - (t - point.time) / 1.2;
                    ctx.fillStyle = `rgba(208,221,222,${.16 * life * life})`;
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, .65 * life, 0, TAU);
                    ctx.fill();
                }

        function fish(state) {
            const index = state.index, stroke = state.phase;
            const centerX = state.x, centerY = state.y;
            // The head is at u=0; the trailing fins extend along positive local X.
            const heading = state.heading + Math.PI;
            const roll = .32 + .16 * Math.sin(t * .17 + index * 2.6);
            const pitch = .09 * Math.sin(t * .17 + index * 2.5);
            const size = unit * state.scale * school.bodyFit;
            const cp = Math.cos(pitch), sp = Math.sin(pitch);
            const ch = Math.cos(heading), sh = Math.sin(heading);
            const spine = createSpine(state);
            function radius(u) {
                return (.032 + .265 * Math.pow(Math.sin(Math.PI * Math.min(1, u / .99)), 1.35)) * (1 - u * .55);
            }

            function project(u, y = 0, z = 0) {
                const p = spine(u), eps = .002, next = spine(u + eps);
                const bend = Math.atan2(next[1] - p[1], next[0] - p[0]);
                const localRoll = roll + .14 * Math.sin(u * 5.4 - stroke);
                const yy = y * Math.cos(localRoll) - z * Math.sin(localRoll);
                const zz = y * Math.sin(localRoll) + z * Math.cos(localRoll);
                const x = p[0] - yy * Math.sin(bend), v = p[1] + yy * Math.cos(bend);
                const depth = (p[2] + zz) * cp + x * sp;
                const xx = x * cp - (p[2] + zz) * sp;
                const perspective = 4.7 / (4.7 + depth);

                return [centerX + (xx * ch - v * sh) * size * perspective,
                    centerY + (xx * sh + v * ch) * size * perspective, perspective];
            }

            function curve(points, opacity, lineWidth = .6, dotted = false) {
                if (!points.length)
                    return;

                ctx.strokeStyle = `rgba(224,231,232,${Math.min(1, opacity * 2)})`;
                ctx.fillStyle = `rgba(235,239,237,${Math.min(1, opacity * 3)})`;
                ctx.lineWidth = lineWidth * Math.max(.95, unit / 550);

                if (!dotted) {
                    ctx.beginPath();
                    ctx.moveTo(points[0][0], points[0][1]);

                    for (let i = 1; i < points.length; i++)
                        ctx.lineTo(points[i][0], points[i][1]);

                    ctx.stroke();
                }

                ctx.beginPath();

                for (let i = 0; i < points.length; i += dotted ? 1 : 3) {
                    const p = points[i], r = (dotted ? 1 : .8) * Math.max(.8, unit / 550) * p[2];
                    ctx.moveTo(p[0] + r / 2, p[1]);
                    ctx.arc(p[0], p[1], r / 2, 0, TAU);
                }

                ctx.fill();
            }

            // Every rib follows the local tangent and rolls along the flexing spine.
            for (let rib = 0; rib < Math.round(65 * detail); rib++) {
                const u = .035 + rib / Math.round(65 * detail) * .89, r = radius(u);
                const points = [];

                for (let k = 0; k <= 30; k++) {
                    const a = k / 30 * TAU;
                    points.push(project(u + .034 * Math.sin(a) ** 2, Math.cos(a) * r, Math.sin(a) * r * .64));
                }

                curve(points, .12 + .23 * Math.sin(Math.PI * u), .46, rib % 3 !== 0);

                if (rib % 2 === 0) {
                    const p = project(u), q = project(u, -.018, .008);
                    curve([p, q], .7, .85);
                }
            }

            for (let rail = 0; rail < 7; rail++) {
                const a = rail / 7 * TAU, points = [];

                for (let k = 0; k <= 80; k++) {
                    const u = .018 + k / 80 * .955, r = radius(u);
                    points.push(project(u, Math.cos(a) * r, Math.sin(a) * r * .64));
                }

                curve(points, rail === 0 ? .42 : .13, rail === 0 ? .72 : .42, rail % 2 === 0);
            }

            // Long, separate fin filaments form an airy sail above and below the body.
            for (let side of [-1, 1])
                for (let j = 0; j < Math.round(33 * detail); j++) {
                    const u = .2 + j / Math.round(33 * detail) * .61, r = radius(u), points = [];
                    const finPhase = u * 5.4 - stroke + side * .45;
                    const sail = Math.sin((u - .2) / .61 * Math.PI) * (.25 + .065 * Math.sin(finPhase));

                    for (let k = 0; k <= 16; k++) {
                        const v = k / 16, flutter = Math.sin(finPhase - v * 1.8) * v * v;
                        points.push(project(u + v * .125 + flutter * .014, side * (r + v * sail + flutter * .018), .045 * Math.sin(v * Math.PI) + flutter * .06));
                    }

                    curve(points, .15 + .13 * Math.sin(u * Math.PI), .45, j % 3 !== 0);
                }

            // Forked tail rays open, fold, and twist together with the swimming stroke.
            for (let ray = 0; ray < Math.round(39 * detail); ray++) {
                const a = ray / Math.max(1, Math.round(39 * detail) - 1) * 2 - 1, points = [];

                for (let k = 0; k <= 24; k++) {
                    const v = k / 24, fork = .2 + Math.abs(a) * .18;
                    points.push(project(.925 + v * fork, a * v * .37, Math.sin(stroke - v * 2) * v * .07));
                }

                curve(points, .13 + Math.abs(a) * .2, .48, ray % 4 !== 0);
            }

            for (let side of [-1, 1]) {
                for (let j = 0; j < 10; j++) {
                    const points = [];

                    for (let k = 0; k <= 24; k++) {
                        const v = k / 24;
                        points.push(project(.23 + v * (.18 + j * .009), side * (radius(.23) + Math.sin(v * Math.PI / 2) * (.15 + j * .011)), Math.sin(v * 3 - stroke) * .02));
                    }

                    curve(points, .15, .42, true);
                }
            }

            curve(Array.from({ length: 125 }, (_, k) => project(k / 124)), .63, .65);
        }

        for (const state of school.fish)
            fish(state);

        ctx.restore();
    }

    const school = createSchool(800, 414), design = { trails: true, detail: 1 };
    let width = 800, height = 414, paused = false, cue = null, message = 'Two fish, swimming independently.';
    function attract(x, y) {
        school.attract(x, y);
        cue = { x, y, time: school.time };
        message = paused ? 'Destination set. Press Play to swim there.' : 'A quick dart, then swimming toward the click.';
    }

    return {
        meta: { style: 'fish', title: 'DRIFT', hint: 'Click or tap anywhere to draw them toward that point.', brand: 'TSUGUMORI // ORGANIC', fields: 0 },
        get paused() {
            return paused;
        },
        setPaused(value) {
            paused = value;
            message = paused ? 'Animation paused.' : 'Animation playing.';
        },
        controls() {
            return [{ key: 'gather', type: 'button', label: school.gathered ? 'RELEASE' : 'GATHER', pressed: school.gathered }];
        },
        status: () => message, archives: () => [],
        action(key) {
            if (key === 'gather') {
                school.setGathered(!school.gathered);
                message = school.gathered ? 'The pair draw together.' : 'The pair swim freely.';
            }
        },
        pointer(kind, x, y) {
            if (kind === 'click')
                attract(x, y);
        },
        key(key) {
            if (key === 'activate')
                attract(width * .5, height * .5);
        },
        configure(settings) {
            Object.assign(design, settings);
        }, needsMotion: () => true, suspend() {
        },
        render(ctx, w, h, elapsed) {
            if (w !== width || h !== height) {
                width = w;
                height = h;
                school.resize(w, h);
                cue = null;
            }

            if (!paused && elapsed > 0)
                school.step(Math.min(.05, elapsed));

            drawSpaceFish(ctx, width, height, school, design);

            if (cue) {
                const age = school.time - cue.time;

                if (age >= .8) {
                    cue = null;

                    return;
                }

                ctx.strokeStyle = `rgba(208,221,222,${.3 * (1 - age / .8)})`;
                ctx.lineWidth = .8;
                ctx.beginPath();
                ctx.arc(cue.x, cue.y, 5 + age * 12, 0, Math.PI * 2);
                ctx.stroke();
            }
        },
        inspect() {
            return { time: school.time, gathered: school.gathered, fish: school.fish.map(f => ({ x: f.x, y: f.y, heading: f.heading, target: f.target, trail: f.trail.length })) };
        }
    };
}
