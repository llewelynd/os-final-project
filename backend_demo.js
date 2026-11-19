// Backend console demo: runs the non-preemptive algorithms on hard-coded process sets
// and prints the Gantt chart, per-process CT/TAT/WT, and averages. No GUI needed.
// Run from the project root with:  node backend_demo.js
const S = require('./js/algorithms.js');

function show(name, o) {
  console.log(`\n=== ${name} ===`);
  console.log('Gantt: ' + o.gantt.map(s => `| ${s.pid} ${s.start}-${s.end} `).join('') + '|');
  console.log(`${'PID'.padEnd(4)} ${'AT'.padStart(4)} ${'BT'.padStart(3)} ${'CT'.padStart(3)} ${'TAT'.padStart(4)} ${'WT'.padStart(3)}`);
  for (const r of o.results) {
    console.log(`${r.pid.padEnd(4)} ${String(r.at).padStart(4)} ${String(r.bt).padStart(3)} ${String(r.ct).padStart(3)} ${String(r.tat).padStart(4)} ${String(r.wt).padStart(3)}`);
  }
  console.log(`Average TAT = ${o.avgTat.toFixed(2)}   Average WT = ${o.avgWt.toFixed(2)}`);
}

// Set 1: same as sample/processes.csv
const set1 = [
  { pid: 'P1', at: 0, bt: 5 },
  { pid: 'P2', at: 2, bt: 3 },
  { pid: 'P3', at: 8, bt: 2 },
  { pid: 'P4', at: 9, bt: 4 },
];
// Set 2: SJF picks the shorter job C ahead of B
const set2 = [
  { pid: 'A', at: 0, bt: 6 },
  { pid: 'B', at: 1, bt: 4 },
  { pid: 'C', at: 2, bt: 1 },
];

console.log('CPUSchedSim - Backend check (non-preemptive algorithms)');
console.log('------------------------------------------------------');
console.log('\n[Set 1: sample/processes.csv]');
show('FCFS (non-preemptive)', S.run('FCFS', set1));
show('SJF (non-preemptive)', S.run('SJF', set1));
console.log('\n[Set 2: SJF reorders the ready queue]');
show('FCFS (non-preemptive)', S.run('FCFS', set2));
show('SJF (non-preemptive)', S.run('SJF', set2));

// ---- Page replacement ----
const PR = require('./js/pagereplacement.js');
const refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
console.log('\n\nCPUSchedSim - Page replacement (3 frames)');
console.log('Reference string: ' + refs.join(' '));
for (const a of ['FIFO', 'LRU', 'OPT']) {
  const o = PR.run(a, refs, 3);
  console.log(`\n=== ${a} ===`);
  console.log('Ref   : ' + o.steps.map(s => String(s.page).padStart(2)).join(' '));
  for (let f = 0; f < 3; f++) console.log(`Frame${f + 1}: ` + o.steps.map(s => (s.frames[f] === null ? '-' : String(s.frames[f])).padStart(2)).join(' '));
  console.log('Result: ' + o.steps.map(s => (s.hit ? 'H' : 'F').padStart(2)).join(' '));
  console.log(`Faults = ${o.faults}  Hits = ${o.hits}  Fault ratio = ${(o.faultRatio * 100).toFixed(1)}%`);
}
