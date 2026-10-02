// SPDX-License-Identifier: 0BSD
(() => {
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
    for (const p of a) for (const q of b) {
      const dx = p.x - q.x, dy = p.y - q.y, distance = Math.hypot(dx, dy);
      const gap = distance - p.radius - q.radius;
      if (gap < closest.gap) closest = { gap, x: distance > .001 ? dx / distance : 0, y: distance > .001 ? dy / distance : 1 };
    }
    return closest;
  }

  function createSchool(width, height) {
    let seed = 704;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    const school = {
      width, height, time: 0, gathered: false,
      get unit() { return Math.min(this.width * .92, this.height * .78); },
      get bodyFit() { return Math.min(1, this.width / (this.unit * 1.65)); },
      fish: [
        { x: width * .35, y: height * .38, heading: -.18, pace: .075, phase: .8, scale: .18 },
        { x: width * .65, y: height * .64, heading: Math.PI + .12, pace: .063, phase: 3.6, scale: .17 },
      ].map((fish, index) => ({ ...fish, index, bodyHeadings: Array(9).fill(fish.heading), speed: 0, turn: 0, edgeSide: 0, burst: 0, target: null, destination: null, wanderUntil: 0, trail: [], trailTime: 0 })),
      attract(x, y) {
        this.gathered = false;
        assignTargets(x, y);
        for (const fish of this.fish) fish.burst = 1;
      },
      setGathered(value) {
        this.gathered = value;
        for (const fish of this.fish) {
          fish.target = null;
          fish.destination = null;
        }
        if (value) assignTargets(this.width * .5, this.height * .52);
      },
      resize(nextWidth, nextHeight) {
        const sx = nextWidth / this.width, sy = nextHeight / this.height;
        for (const fish of this.fish) {
          fish.x *= sx; fish.y *= sy;
          fish.heading = Math.atan2(Math.sin(fish.heading) * sy, Math.cos(fish.heading) * sx);
          fish.bodyHeadings = fish.bodyHeadings.map(heading => Math.atan2(Math.sin(heading) * sy, Math.cos(heading) * sx));
          fish.edgeSide = 0;
          for (const point of [fish.target, fish.destination, ...fish.trail]) {
            if (point) { point.x *= sx; point.y *= sy; }
          }
        }
        const oldUnit = this.unit;
        this.width = nextWidth; this.height = nextHeight;
        for (const fish of this.fish) fish.speed *= this.unit / oldUnit;
        keepClear();
      },
      step(elapsed) {
        // Short substeps keep turns consistent across refresh rates and slow frames.
        let remaining = clamp(elapsed, 0, .1);
        while (remaining > .000001) {
          const dt = Math.min(remaining, 1 / 120);
          this.time += dt;
          const avoidance = avoidEachOther();
          for (const fish of this.fish) swim(fish, dt, avoidance[fish.index]);
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
        fish.target = { ...center, [axis]: center[axis] + (fish.index === first ? -spacing : spacing) };
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
        return body.map(p => ({ ...p, x: p.x + Math.cos(fish.heading) * fish.speed * ahead, y: p.y + Math.sin(fish.heading) * fish.speed * ahead }));
      });
      const predicted = closestGap(future[0], future[1]);
      // Prediction controls when to react, not the side to pass on. Using the
      // predicted normal can flip it after the projected bodies cross.
      const nearby = { ...current, gap: Math.min(predicted.gap, current.gap) };
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
        if (contact.gap >= 0) break;
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
      } else {
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
      if (!fish.destination || (!fish.target && (school.time > fish.wanderUntil || Math.hypot(fish.destination.x - fish.x, fish.destination.y - fish.y) < unit * .14))) chooseDestination(fish);
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
      if (edgePressure < .04) fish.edgeSide = 0;
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
      while (fish.trail.length && school.time - fish.trail[0].time > 1.2) fish.trail.shift();
    }

    for (const fish of school.fish) {
      fish.speed = school.unit * fish.pace;
      chooseDestination(fish);
    }
    keepClear();
    return school;
  }

  const api = { createSchool, createSpine, bodyEnvelope };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else globalThis.XLR8FishMotion = api;
})();
