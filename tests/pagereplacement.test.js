// Run with: node tests/pagereplacement.test.js
const assert = require('assert');
const PR = require('../js/pagereplacement.js');

// Classic textbook reference string, 3 frames: FIFO 15, LRU 12, OPT 9 faults.
const R = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
assert.strictEqual(PR.fifo(R, 3).faults, 15);
assert.strictEqual(PR.lru(R, 3).faults, 12);
assert.strictEqual(PR.optimal(R, 3).faults, 9);

// Belady's anomaly: FIFO gets worse with more frames (9 faults at 3, 10 at 4).
const B = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
assert.strictEqual(PR.fifo(B, 3).faults, 9);
assert.strictEqual(PR.fifo(B, 4).faults, 10);
assert.strictEqual(PR.lru(B, 3).faults, 10);
assert.strictEqual(PR.optimal(B, 3).faults, 7);

// Step detail: FIFO on the textbook string, first replacement happens at the 4th reference.
let o = PR.fifo(R, 3);
assert.deepStrictEqual(o.steps[2].frames, [7, 0, 1]);
assert.strictEqual(o.steps[3].replaced, 7);
assert.deepStrictEqual(o.steps[3].frames, [2, 0, 1]);
assert.strictEqual(o.steps[4].hit, true);
assert.strictEqual(o.hits + o.faults, R.length);
assert.ok(Math.abs(o.faultRatio - 0.75) < 1e-9);

// LRU keeps a recently-hit page: 1,2,1,3 with 2 frames evicts 2, not 1.
o = PR.lru([1, 2, 1, 3], 2);
assert.strictEqual(o.steps[3].replaced, 2);

// Edge cases: single frame, repeated page, run() dispatch and bad name.
assert.strictEqual(PR.fifo([1, 1, 1], 1).faults, 1);
assert.strictEqual(PR.run('OPT', R, 3).faults, 9);
assert.throws(() => PR.run('NOPE', R, 3));
console.log('All page replacement tests passed.');
