/* Scheduling algorithms. Pure functions, no DOM access.
 * Input:  procs = [{pid, at, bt}]  (integers)
 * Output: { gantt: [{pid, start, end}], results: [{pid, at, bt, ct, tat, wt}], avgTat, avgWt }
 * Idle time is a gantt entry with pid === "IDLE". Results keep input order. */
(function (root) {
  'use strict';

  function pushSeg(gantt, pid, start, end) {
    var last = gantt[gantt.length - 1];
    if (last && last.pid === pid && last.end === start) last.end = end; // merge contiguous
    else gantt.push({ pid: pid, start: start, end: end });
  }

  function finish(procs, gantt, ct) {
    var results = procs.map(function (p) {
      var c = ct[p.pid], tat = c - p.at;
      return { pid: p.pid, at: p.at, bt: p.bt, ct: c, tat: tat, wt: tat - p.bt };
    });
    var n = results.length || 1;
    var sum = function (k) { return results.reduce(function (s, r) { return s + r[k]; }, 0); };
    return { gantt: gantt, results: results, avgTat: sum('tat') / n, avgWt: sum('wt') / n };
  }

  // Shared non-preemptive loop; pick() chooses from the ready list.
  function nonPreemptive(procs, pick) {
    var pending = procs.map(function (p, i) { return { p: p, i: i }; });
    var gantt = [], ct = {}, time = 0;
    while (pending.length) {
      var ready = pending.filter(function (x) { return x.p.at <= time; });
      if (!ready.length) {
        var next = Math.min.apply(null, pending.map(function (x) { return x.p.at; }));
        pushSeg(gantt, 'IDLE', time, next);
        time = next;
        continue;
      }
      var chosen = pick(ready);
      pushSeg(gantt, chosen.p.pid, time, time + chosen.p.bt);
      time += chosen.p.bt;
      ct[chosen.p.pid] = time;
      pending.splice(pending.indexOf(chosen), 1);
    }
    return finish(procs, gantt, ct);
  }

  function fcfs(procs) {
    return nonPreemptive(procs, function (ready) {
      return ready.reduce(function (a, b) {
        return (b.p.at < a.p.at || (b.p.at === a.p.at && b.i < a.i)) ? b : a;
      });
    });
  }

  function sjf(procs) {
    return nonPreemptive(procs, function (ready) {
      return ready.reduce(function (a, b) {
        if (b.p.bt !== a.p.bt) return b.p.bt < a.p.bt ? b : a;
        if (b.p.at !== a.p.at) return b.p.at < a.p.at ? b : a;
        return b.i < a.i ? b : a;
      });
    });
  }

  // Round Robin. New arrivals are queued before a preempted process is re-queued.
  function rr(procs, quantum) {
    var order = procs.map(function (p, i) { return { p: p, i: i, rem: p.bt }; })
      .sort(function (a, b) { return a.p.at - b.p.at || a.i - b.i; });
    var gantt = [], ct = {}, queue = [], time = 0, nextIdx = 0, done = 0;

    function admit() {
      while (nextIdx < order.length && order[nextIdx].p.at <= time) queue.push(order[nextIdx++]);
    }

    while (done < order.length) {
      admit();
      if (!queue.length) {
        var t = order[nextIdx].p.at;
        pushSeg(gantt, 'IDLE', time, t);
        time = t;
        continue;
      }
      var cur = queue.shift();
      var slice = Math.min(quantum, cur.rem);
      pushSeg(gantt, cur.p.pid, time, time + slice);
      time += slice;
      cur.rem -= slice;
      admit();
      if (cur.rem > 0) queue.push(cur);
      else { ct[cur.p.pid] = time; done++; }
    }
    return finish(procs, gantt, ct);
  }

  function run(algo, procs, quantum) {
    if (algo === 'FCFS') return fcfs(procs);
    if (algo === 'SJF') return sjf(procs);
    if (algo === 'RR') return rr(procs, quantum);
    throw new Error('Unknown algorithm: ' + algo);
  }

  var api = { fcfs: fcfs, sjf: sjf, rr: rr, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Scheduler = api;
})(typeof window !== 'undefined' ? window : this);
