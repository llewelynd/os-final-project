// Run with: node tests/algorithms.test.js
const assert = require('assert');
const S = require('../js/algorithms.js');
const P = [{ pid: 'P1', at: 0, bt: 5 }, { pid: 'P2', at: 2, bt: 3 }, { pid: 'P3', at: 8, bt: 2 }];
const ct = o => o.results.map(r => r.ct);
const segs = o => o.gantt.map(s => `${s.pid}:${s.start}-${s.end}`).join(' ');

let o = S.fcfs(P);
assert.deepStrictEqual(ct(o), [5, 8, 10]);
assert.strictEqual(segs(o), 'P1:0-5 P2:5-8 P3:8-10');
assert.deepStrictEqual(o.results.map(r => r.wt), [0, 3, 0]);

o = S.fcfs([{ pid: 'A', at: 3, bt: 2 }]);
assert.strictEqual(segs(o), 'IDLE:0-3 A:3-5');

o = S.sjf([{ pid: 'A', at: 0, bt: 6 }, { pid: 'B', at: 1, bt: 4 }, { pid: 'C', at: 2, bt: 1 }]);
assert.strictEqual(segs(o), 'A:0-6 C:6-7 B:7-11');

o = S.rr([{ pid: 'A', at: 0, bt: 5 }, { pid: 'B', at: 1, bt: 3 }, { pid: 'C', at: 2, bt: 1 }], 2);
assert.strictEqual(segs(o), 'A:0-2 B:2-4 C:4-5 A:5-7 B:7-8 A:8-9');
assert.deepStrictEqual(ct(o), [9, 8, 5]);
assert.ok(Math.abs(o.avgTat - 19 / 3) < 1e-9);

o = S.rr([{ pid: 'A', at: 0, bt: 1 }, { pid: 'B', at: 4, bt: 1 }], 3);
assert.strictEqual(segs(o), 'A:0-1 IDLE:1-4 B:4-5');
console.log('All tests passed.');
