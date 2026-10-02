import { expect, test } from 'bun:test';
import { createSchool, createSpine, bodyEnvelope } from '../../../widgets/interactive-art/fish-in-space/preview/motion.js';

const advance = (school, seconds, hz = 60) => {
  for (let i = 0; i < seconds * hz; i++) school.step(1 / hz);
};
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const turn = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const arrivalDistance = (school, fish, target) => Math.min(distance(fish, target), distance(bodyEnvelope(fish, school.unit, school.bodyFit)[0], target));

test('fish cruise continuously on independent paths without abrupt turns', () => {
  const school = createSchool(800, 414);
  const initial = school.fish.map(fish => ({ ...fish }));
  let shortestStep = Infinity, longestStep = 0, largestTurn = 0;
  for (let frame = 0; frame < 480; frame++) {
    const before = school.fish.map(fish => ({ ...fish }));
    school.step(1 / 60);
    school.fish.forEach((fish, i) => {
      const step = distance(fish, before[i]);
      shortestStep = Math.min(shortestStep, step);
      longestStep = Math.max(longestStep, step);
      largestTurn = Math.max(largestTurn, turn(fish.heading, before[i].heading));
    });
  }
  expect(shortestStep).toBeGreaterThan(.1);
  expect(longestStep).toBeLessThan(1);
  expect(largestTurn).toBeLessThan(.025);
  for (let i = 0; i < 2; i++) expect(distance(initial[i], school.fish[i])).toBeGreaterThan(100);
  // Independent fish can turn back toward the center, but must not remain at
  // a fixed distance as though attached to the same rotating orbit.
  expect(Math.abs(distance(initial[0], initial[1]) - distance(school.fish[0], school.fish[1]))).toBeGreaterThan(25);
  expect(school.fish[0].speed).not.toBe(school.fish[1].speed);
});

test('a click gives a short burst, reaches the destination, and releases each fish', () => {
  const school = createSchool(800, 414);
  advance(school, 3);
  const before = school.fish.map(fish => ({ ...fish }));
  const target = { x: 580, y: 150 };
  school.attract(target.x, target.y);
  const approaches = school.fish.map(fish => ({ ...fish.target }));
  expect(distance(approaches[0], approaches[1])).toBeGreaterThan(school.unit * .5);
  school.fish.forEach((fish, i) => expect(distance(fish, before[i])).toBe(0));
  advance(school, .25);
  const burstSpeeds = school.fish.map(fish => fish.speed);
  school.fish.forEach((fish, i) => expect(fish.speed).toBeGreaterThan(before[i].speed * 1.4));
  const nearest = [Infinity, Infinity];
  let longestStep = 0, largestTurn = 0;
  for (let frame = 0; frame < 1200; frame++) {
    const previous = school.fish.map(fish => ({ ...fish }));
    school.step(1 / 60);
    school.fish.forEach((fish, i) => {
      nearest[i] = Math.min(nearest[i], arrivalDistance(school, fish, approaches[i]));
      longestStep = Math.max(longestStep, distance(fish, previous[i]));
      largestTurn = Math.max(largestTurn, turn(fish.heading, previous[i].heading));
    });
  }
  expect(longestStep).toBeLessThan(1.6);
  expect(largestTurn).toBeLessThan(.04);
  school.fish.forEach((fish, i) => {
    expect(nearest[i]).toBeLessThan(school.unit * .17);
    expect(fish.target).toBeNull();
    expect(fish.speed).toBeLessThan(burstSpeeds[i] * .7);
  });
});

test('the latest click replaces gathering and the previous destination', () => {
  const school = createSchool(800, 414);
  school.setGathered(true);
  advance(school, 1);
  school.attract(500, 120);
  advance(school, .2);
  school.attract(180, 290);
  expect(school.gathered).toBe(false);
  const approaches = school.fish.map(fish => ({ ...fish.target }));
  expect(distance(approaches[0], approaches[1])).toBeGreaterThan(school.unit * .5);
  expect((approaches[0].x + approaches[1].x) / 2).toBe(180);
  const nearest = [Infinity, Infinity];
  for (let i = 0; i < 1500; i++) {
    school.step(1 / 60);
    school.fish.forEach((fish, index) => { nearest[index] = Math.min(nearest[index], arrivalDistance(school, fish, approaches[index])); });
  }
  for (const value of nearest) expect(value).toBeLessThan(school.unit * .17);
  for (const fish of school.fish) expect(fish.target).toBeNull();
});

test('a turn reaches the head before the tail and reverses without snapping', () => {
  const school = createSchool(2400, 1000), fish = school.fish[0];
  school.fish[1].x = 2100;
  fish.x = 800; fish.y = 500; fish.heading = 0; fish.bodyHeadings.fill(0);
  fish.target = { x: 800, y: 800 };
  advance(school, .75);
  const [head, , , , body, , , , tail] = fish.bodyHeadings;
  expect(head).toBeGreaterThan(.25);
  expect(body).toBeGreaterThan(tail);
  expect(body).toBeLessThan(head);
  expect(tail).toBeLessThan(head * .4);

  fish.target = { x: 800, y: 250 };
  let reversed = false;
  let largestTurnChange = 0, largestHeadingStep = 0;
  for (let frame = 0; frame < 180; frame++) {
    const before = fish.turn, headings = [...fish.bodyHeadings];
    school.step(1 / 60);
    largestTurnChange = Math.max(largestTurnChange, Math.abs(fish.turn - before));
    fish.bodyHeadings.forEach((heading, i) => { largestHeadingStep = Math.max(largestHeadingStep, turn(heading, headings[i])); });
    if (fish.turn < -.5) reversed = true;
  }
  expect(largestTurnChange).toBeLessThanOrEqual(1.35 / 60 + 1e-9);
  expect(largestHeadingStep).toBeLessThan(.02);
  expect(reversed).toBe(true);
});

test('the rendered backbone bends without stretching or breaking at the angle seam', () => {
  const school = createSchool(2400, 1000), fish = school.fish[0];
  school.fish[1].x = 2100;
  fish.x = 800; fish.y = 500; fish.heading = 3; fish.bodyHeadings.fill(3);
  fish.target = { x: 800, y: 250 };
  advance(school, 1.25);
  expect(fish.heading).toBeGreaterThan(Math.PI);
  const spine = createSpine(fish);
  const straight = createSpine({ ...fish, bodyHeadings: fish.bodyHeadings.map(() => fish.heading) });
  const wrapped = createSpine({ ...fish, bodyHeadings: fish.bodyHeadings.map(angle => Math.atan2(Math.sin(angle), Math.cos(angle))) });
  let curvedLength = 0, straightLength = 0, largestWrapError = 0;
  for (let i = 1; i <= 68; i++) {
    const u = i * .02, point = spine(u), previous = spine(u - .02);
    const original = straight(u), originalPrevious = straight(u - .02);
    curvedLength += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    straightLength += Math.hypot(original[0] - originalPrevious[0], original[1] - originalPrevious[1]);
    wrapped(u).forEach((value, axis) => { largestWrapError = Math.max(largestWrapError, Math.abs(value - point[axis])); });
  }
  expect(largestWrapError).toBeLessThan(5e-9);
  expect(curvedLength).toBeCloseTo(straightLength, 8);
  expect(Math.hypot(spine(1.3)[0] - straight(1.3)[0], spine(1.3)[1] - straight(1.3)[1])).toBeGreaterThan(.3);
});

test('refresh rate does not change the swimming route or click response', () => {
  const slow = createSchool(800, 414), fast = createSchool(800, 414);
  advance(slow, 4, 30); advance(fast, 4, 120);
  slow.attract(600, 300); fast.attract(600, 300);
  advance(slow, 8, 30); advance(fast, 8, 120);
  slow.fish.forEach((fish, i) => {
    expect(distance(fish, fast.fish[i])).toBeLessThan(.01);
    expect(turn(fish.heading, fast.fish[i].heading)).toBeLessThan(.001);
    fish.bodyHeadings.forEach((heading, j) => expect(turn(heading, fast.fish[i].bodyHeadings[j])).toBeLessThan(.001));
  });
});

test('fish stay within narrow and wide scenes during long swims and edge clicks', () => {
  for (const [width, height] of [[280, 390], [1200, 414]]) {
    const school = createSchool(width, height);
    let closestEdge = Infinity, longestTrail = 0;
    for (let i = 0; i < 5400; i++) {
      if (i % 900 === 0) school.attract(i % 1800 === 0 ? 0 : width, i % 2700 === 0 ? 0 : height);
      school.step(1 / 60);
      for (const fish of school.fish) {
        closestEdge = Math.min(closestEdge, fish.x, width - fish.x, fish.y, height - fish.y);
        longestTrail = Math.max(longestTrail, fish.trail.length);
      }
    }
    expect(closestEdge).toBeGreaterThan(0);
    expect(longestTrail).toBeLessThan(20);
  }
});

test('resize preserves the current swim and pending destination', () => {
  const school = createSchool(800, 414);
  advance(school, 4);
  school.attract(600, 300);
  const before = school.fish.map(fish => ({ ...fish, target: { ...fish.target } }));
  school.resize(400, 414);
  school.fish.forEach((fish, i) => {
    expect(fish.x).toBeCloseTo(before[i].x / 2);
    expect(fish.y).toBeCloseTo(before[i].y);
    expect(fish.phase).toBe(before[i].phase);
    expect(fish.target).toEqual({ x: before[i].target.x / 2, y: before[i].target.y });
  });
});

test('the swimming wave flexes the front of the body without shaking the head', () => {
  const fish = createSchool(800, 414).fish[0], front = [], tail = [];
  let largestStep = 0;
  for (let i = 0; i <= 120; i++) {
    fish.phase = i / 120 * Math.PI * 2;
    const spine = createSpine(fish);
    front.push(spine(.2)[1]); tail.push(spine(1.2)[1]);
    if (i > 0) largestStep = Math.max(largestStep, Math.abs(front[i] - front[i - 1]));
  }
  expect(largestStep).toBeLessThan(.01);
  const amplitude = values => Math.max(...values) - Math.min(...values);
  expect(amplitude(front)).toBeGreaterThan(.10);
  expect(amplitude(front)).toBeLessThan(amplitude(tail) * .5);
});

test('body, fin, and tail clearances survive shared clicks, gathering, and narrow scenes', () => {
  for (const [width, height] of [[280, 390], [800, 414], [1200, 414]]) {
    const school = createSchool(width, height);
    let closestFish = Infinity, closestEdge = Infinity;
    for (let frame = 0; frame < 3600; frame++) {
      if (frame % 900 === 0) school.attract(frame % 1800 ? 0 : width, frame % 2700 ? 0 : height);
      if (frame % 900 === 450) school.setGathered(true);
      school.step(1 / 60);
      const bodies = school.fish.map(fish => bodyEnvelope(fish, school.unit, school.bodyFit));
      for (const a of bodies[0]) for (const b of bodies[1]) {
        closestFish = Math.min(closestFish, distance(a, b) - a.radius - b.radius);
      }
      for (const body of bodies) for (const p of body) {
        closestEdge = Math.min(closestEdge, p.x - p.radius, width - p.x - p.radius, p.y - p.radius, height - p.y - p.radius);
      }
    }
    expect(closestFish).toBeGreaterThanOrEqual(-.02);
    expect(closestEdge).toBeGreaterThan(school.unit * .02);
  }
});

const edges = [
  ['left wall', 380, 500, Math.PI, -500, 500],
  ['right wall', 2620, 500, 0, 3500, 500],
  ['top wall', 800, 380, -Math.PI / 2, 800, -500],
  ['bottom wall', 800, 620, Math.PI / 2, 800, 1500],
  ['top left corner', 380, 380, -Math.PI * .75, -500, -500],
  ['top right corner', 2620, 380, -Math.PI * .25, 3500, -500],
  ['bottom left corner', 380, 620, Math.PI * .75, -500, 1500],
  ['bottom right corner', 2620, 620, Math.PI * .25, 3500, 1500],
];
for (const [name, x, y, heading, targetX, targetY] of edges) test(`fish turn at the ${name} without being pushed back inside`, () => {
  const school = createSchool(3000, 1000), fish = school.fish[0], other = school.fish[1];
  // Force an outward intent even though normal clicks are clamped inside.
  Object.assign(fish, { x, y, heading, turn: 0, target: { x: targetX, y: targetY }, burst: 1 });
  fish.bodyHeadings.fill(heading);
  Object.assign(other, { x: x > 1500 ? 500 : 2500, y: 500, heading: x > 1500 ? Math.PI : 0, destination: { x: x > 1500 ? 300 : 2700, y: 800 }, wanderUntil: 100 });
  other.bodyHeadings.fill(other.heading);
  let largestPositionError = 0, slowestSpeed = Infinity, closestEdge = Infinity;
  for (let i = 0; i < 1440; i++) {
    const before = { x: fish.x, y: fish.y };
    school.step(1 / 120);
    // All movement must come from swimming, not the containment fallback.
    largestPositionError = Math.max(largestPositionError,
      Math.abs(fish.x - before.x - Math.cos(fish.heading) * fish.speed / 120),
      Math.abs(fish.y - before.y - Math.sin(fish.heading) * fish.speed / 120));
    slowestSpeed = Math.min(slowestSpeed, fish.speed);
    for (const p of bodyEnvelope(fish, school.unit, school.bodyFit)) {
      closestEdge = Math.min(closestEdge, p.x - p.radius, school.width - p.x - p.radius, p.y - p.radius, school.height - p.y - p.radius);
    }
  }
  expect(largestPositionError).toBeLessThan(5e-7);
  expect(slowestSpeed).toBeGreaterThan(school.unit * fish.pace * .2);
  expect(closestEdge).toBeGreaterThan(school.unit * .04);
});
