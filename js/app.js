/* UI: input table, validation, CSV upload, Gantt chart and metrics rendering. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var tbody = document.querySelector('#input-table tbody');
  var DEFAULTS = [['P1', 0, 5], ['P2', 2, 3], ['P3', 8, 2]];

  function addRow(pid, at, bt) {
    var tr = document.createElement('tr');
    var n = tbody.rows.length + 1;
    var vals = [pid || 'P' + n, at === undefined ? '' : at, bt === undefined ? '' : bt];
    vals.forEach(function (v, i) {
      var td = document.createElement('td');
      var inp = document.createElement('input');
      inp.type = i === 0 ? 'text' : 'number';
      if (i) { inp.min = i === 1 ? '0' : '1'; inp.step = '1'; }
      inp.value = v;
      inp.setAttribute('aria-label', ['Process ID', 'Arrival time', 'Burst time'][i]);
      td.appendChild(inp);
      tr.appendChild(td);
    });
    var td = document.createElement('td');
    var x = document.createElement('button');
    x.className = 'x'; x.textContent = '\u00d7'; x.title = 'Remove this row'; x.setAttribute('aria-label', 'Remove row');
    x.onclick = function () { tr.remove(); };
    td.appendChild(x); tr.appendChild(td);
    tbody.appendChild(tr);
  }

  function showErrors(errs) {
    var box = $('msg');
    box.innerHTML = '';
    errs.forEach(function (e) { var d = document.createElement('div'); d.textContent = e; box.appendChild(d); });
  }

  function isInt(s) { return /^\d+$/.test(String(s).trim()); }

  function readInput() {
    var errs = [], procs = [], seen = {};
    Array.prototype.forEach.call(tbody.rows, function (tr, i) {
      var inputs = tr.querySelectorAll('input');
      var pid = inputs[0].value.trim(), at = inputs[1].value, bt = inputs[2].value, label = 'Row ' + (i + 1) + ': ';
      var bad = [false, false, false];
      if (!pid) { errs.push(label + 'Process ID is required.'); bad[0] = true; }
      else if (pid.toUpperCase() === 'IDLE') { errs.push(label + '"IDLE" is reserved. Use another Process ID.'); bad[0] = true; }
      else if (seen[pid]) { errs.push(label + 'Process ID "' + pid + '" is already used.'); bad[0] = true; }
      seen[pid] = true;
      if (!isInt(at)) { errs.push(label + 'Arrival time must be a whole number, 0 or more.'); bad[1] = true; }
      if (!isInt(bt) || Number(bt) <= 0) { errs.push(label + 'Burst time must be a whole number greater than 0.'); bad[2] = true; }
      inputs.forEach(function (el, k) { el.classList.toggle('bad', bad[k]); });
      if (!bad[0] && !bad[1] && !bad[2]) procs.push({ pid: pid, at: Number(at), bt: Number(bt) });
    });
    if (!tbody.rows.length) errs.push('Add at least one process.');
    var q = $('quantum').value;
    if ($('algo').value === 'RR' && (!isInt(q) || Number(q) <= 0)) errs.push('Time quantum must be a whole number greater than 0.');
    return { procs: procs, errs: errs };
  }

  function colorMap(procs) {
    var m = {};
    procs.forEach(function (p, i) { m[p.pid] = i % 10; }); // index into the .c0-.c9 palette in CSS
    return m;
  }

  function renderGantt(out, procs) {
    var g = $('gantt'), colors = colorMap(procs);
    var total = out.gantt[out.gantt.length - 1].end;
    g.className = 'gantt'; g.innerHTML = '';
    void g.offsetWidth; g.className = 'gantt play'; // restart the reveal animation
    out.gantt.forEach(function (s, i) {
      var d = document.createElement('div');
      d.className = 'seg' + (s.pid === 'IDLE' ? ' idle' : '');
      d.style.flex = (s.end - s.start) + ' 0 0';
      if (s.pid !== 'IDLE') d.classList.add('c' + colors[s.pid]);
      d.textContent = s.pid;
      d.title = s.pid + ': ' + s.start + ' to ' + s.end;
      var t = document.createElement('span'); t.className = 't'; t.textContent = s.start; d.appendChild(t);
      if (i === out.gantt.length - 1) {
        var e = document.createElement('span'); e.className = 't end'; e.textContent = total; d.appendChild(e);
      }
      g.appendChild(d);
    });
  }

  function renderMetrics(out) {
    var tb = document.querySelector('#metrics tbody');
    tb.innerHTML = '';
    out.results.forEach(function (r) {
      var tr = document.createElement('tr');
      [r.pid, r.at, r.bt, r.ct, r.tat, r.wt].forEach(function (v) {
        var td = document.createElement('td'); td.textContent = v; tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    var a = $('averages');
    a.hidden = false;
    a.innerHTML = '';
    [['Average turnaround', out.avgTat], ['Average waiting', out.avgWt]].forEach(function (x) {
      var d = document.createElement('div'), b = document.createElement('b'), l = document.createElement('span');
      b.textContent = x[1].toFixed(2); l.textContent = x[0];
      d.appendChild(b); d.appendChild(l); a.appendChild(d);
    });
  }

  function clearResults() {
    $('gantt').className = 'gantt empty';
    $('gantt').textContent = 'Run a simulation to see the schedule.';
    document.querySelector('#metrics tbody').innerHTML = '<tr><td colspan="6" class="empty">No results yet.</td></tr>';
    $('averages').hidden = true;
  }

  function parseCsv(text) {
    var rows = text.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean)
      .map(function (l) { return l.split(',').map(function (c) { return c.trim(); }); });
    if (rows.length && !isInt(rows[0][1] || '')) rows.shift(); // skip header
    return rows;
  }

  $('algo').onchange = function () {
    var rr = this.value === 'RR';
    $('quantum').disabled = !rr;
    if (!rr) $('quantum').value = '';
  };
  $('add').onclick = function () { addRow(); };
  $('delete').onclick = function () { if (tbody.lastElementChild) tbody.lastElementChild.remove(); };
  $('upload').onclick = function () { $('csv').click(); };
  $('csv').onchange = function () {
    var file = this.files[0], input = this;
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var rows = parseCsv(String(reader.result));
      if (!rows.length) { showErrors(['The CSV file has no process rows. Use columns: Process ID, Arrival, Burst.']); }
      else {
        tbody.innerHTML = '';
        rows.forEach(function (r) { addRow(r[0], r[1], r[2]); });
        showErrors([]); clearResults();
      }
      input.value = '';
    };
    reader.readAsText(file);
  };
  $('run').onclick = function () {
    var r = readInput();
    showErrors(r.errs);
    if (r.errs.length) { clearResults(); return; }
    var out = Scheduler.run($('algo').value, r.procs, Number($('quantum').value));
    renderGantt(out, r.procs);
    renderMetrics(out);
  };
  $('reset').onclick = function () {
    tbody.innerHTML = '';
    DEFAULTS.forEach(function (d) { addRow(d[0], d[1], d[2]); });
    $('algo').value = 'FCFS'; $('algo').onchange();
    showErrors([]); clearResults();
  };

  $('reset').onclick();
  $('run').onclick(); // open with a real schedule on screen
})();
