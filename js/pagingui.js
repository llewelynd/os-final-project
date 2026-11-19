/* UI for the page replacement tab and tab switching: validation, frame trace and summary rendering. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var NAMES = { FIFO: 'FIFO', LRU: 'LRU', OPT: 'Optimal' };
  var MAX_REFS = 100;

  var TABS = ['sched', 'paging'];
  function selectTab(name) {
    TABS.forEach(function (t) {
      var on = t === name;
      $(t + '-view').hidden = !on;
      $('tab-' + t).setAttribute('aria-selected', String(on));
      $('tab-' + t).tabIndex = on ? 0 : -1;
    });
  }
  TABS.forEach(function (t, i) {
    $('tab-' + t).onclick = function () { selectTab(t); };
    $('tab-' + t).onkeydown = function (e) { // arrow keys move between tabs
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
      selectTab(n); $('tab-' + n).focus();
    };
  });

  function showErrors(errs) {
    var box = $('pg-msg');
    box.innerHTML = '';
    errs.forEach(function (e) { var d = document.createElement('div'); d.textContent = e; box.appendChild(d); });
  }

  function readInput() {
    var errs = [], tokens = $('pg-refs').value.split(/[\s,]+/).filter(Boolean), refs = [];
    var f = $('pg-frames').value;
    if (!/^\d+$/.test(f.trim()) || Number(f) < 1 || Number(f) > 10) errs.push('Frames must be a whole number from 1 to 10.');
    if (!tokens.length) errs.push('Enter at least one page in the reference string.');
    else if (tokens.length > MAX_REFS) errs.push('Reference string is limited to ' + MAX_REFS + ' pages.');
    else {
      var bad = tokens.filter(function (t) { return !/^\d+$/.test(t); });
      if (bad.length) errs.push('Pages must be whole numbers, 0 or more. Invalid: ' + bad.slice(0, 5).join(', ') + '.');
      else refs = tokens.map(Number);
    }
    $('pg-frames').classList.toggle('bad', /Frames/.test(errs.join()));
    $('pg-refs').classList.toggle('bad', errs.some(function (e) { return !/^Frames/.test(e); }));
    return { refs: refs, frames: Number(f), errs: errs };
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderTrace(out, nFrames) {
    var box = $('pg-trace'), table = el('table'), thead = el('thead'), tbody = el('tbody');
    var hr = el('tr'), r, s;
    box.className = 'trace'; box.innerHTML = '';
    void box.offsetWidth; box.className = 'trace play'; // restart the reveal animation
    hr.appendChild(el('th', 'row', 'Reference'));
    out.steps.forEach(function (st) { hr.appendChild(el('th', 'pg c' + (st.page % 10), st.page)); });
    thead.appendChild(hr); table.appendChild(thead);
    for (s = 0; s < nFrames; s++) {
      r = el('tr'); r.appendChild(el('th', 'row', 'Frame ' + (s + 1)));
      out.steps.forEach(function (st) {
        var v = st.frames[s];
        var td = el('td', v === null ? 'cell blank' : 'cell c' + (v % 10), v === null ? '' : v);
        if (st.loadedIn === s) td.classList.add('new');
        r.appendChild(td);
      });
      tbody.appendChild(r);
    }
    r = el('tr'); r.appendChild(el('th', 'row', 'Result'));
    out.steps.forEach(function (st) {
      var td = el('td', 'res ' + (st.hit ? 'hit' : 'fault'), st.hit ? 'Hit' : 'Fault');
      if (st.replaced !== null) td.title = 'Replaced page ' + st.replaced;
      r.appendChild(td);
    });
    tbody.appendChild(r);
    table.appendChild(tbody); box.appendChild(table);
  }

  function pct(x) { return (x * 100).toFixed(1) + '%'; }

  function stat(label, value) {
    var d = el('div', 'stat'); d.appendChild(el('b', '', value)); d.appendChild(el('span', '', label));
    return d;
  }

  function renderSummary(out, algo, refs, nFrames) {
    var box = $('pg-summary'); box.className = ''; box.innerHTML = '';
    var stats = el('div', 'pg-stats');
    stats.appendChild(stat('Page faults', out.faults));
    stats.appendChild(stat('Hits', out.hits));
    stats.appendChild(stat('Fault ratio', pct(out.faultRatio)));
    stats.appendChild(stat('Hit ratio', pct(out.hitRatio)));
    box.appendChild(stats);
    box.appendChild(el('p', 'note', NAMES[algo] + ' with ' + nFrames + ' frame' + (nFrames > 1 ? 's' : '') + ', ' + refs.length + ' references.'));
  }

  function renderCompare(refs, nFrames) {
    var box = $('pg-summary'); box.className = ''; box.innerHTML = '';
    var rows = ['FIFO', 'LRU', 'OPT'].map(function (a) { return { a: a, o: PageReplacement.run(a, refs, nFrames) }; });
    var min = Math.min.apply(null, rows.map(function (x) { return x.o.faults; }));
    var table = el('table', 'cmp'), head = el('thead'), hr = el('tr'), body = el('tbody');
    ['Algorithm', 'Faults', 'Hits', 'Fault ratio', 'Hit ratio'].forEach(function (h) { hr.appendChild(el('th', '', h)); });
    head.appendChild(hr); table.appendChild(head);
    rows.forEach(function (x) {
      var tr = el('tr', x.o.faults === min ? 'best' : '');
      [NAMES[x.a], x.o.faults, x.o.hits, pct(x.o.faultRatio), pct(x.o.hitRatio)].forEach(function (v) { tr.appendChild(el('td', '', v)); });
      body.appendChild(tr);
    });
    table.appendChild(body); box.appendChild(table);
    box.appendChild(el('p', 'note', 'Comparison for ' + nFrames + ' frame' + (nFrames > 1 ? 's' : '') + ', ' + refs.length + ' references. Fewest faults highlighted.'));
  }

  function clearResults() {
    $('pg-summary').className = 'empty'; $('pg-summary').textContent = 'Run a simulation to see the results.';
    $('pg-trace').className = 'trace empty'; $('pg-trace').textContent = 'Run a simulation to see each step.';
  }

  $('pg-run').onclick = function () {
    var r = readInput(); showErrors(r.errs);
    if (r.errs.length) { clearResults(); return; }
    var algo = $('pg-algo').value, out = PageReplacement.run(algo, r.refs, r.frames);
    renderSummary(out, algo, r.refs, r.frames);
    renderTrace(out, r.frames);
  };

  $('pg-compare').onclick = function () {
    var r = readInput(); showErrors(r.errs);
    if (r.errs.length) { clearResults(); return; }
    var algo = $('pg-algo').value;
    renderCompare(r.refs, r.frames);
    renderTrace(PageReplacement.run(algo, r.refs, r.frames), r.frames);
  };

  $('pg-reset').onclick = function () {
    $('pg-algo').value = 'FIFO';
    $('pg-frames').value = '3';
    $('pg-refs').value = '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1';
    $('pg-frames').classList.remove('bad'); $('pg-refs').classList.remove('bad');
    showErrors([]); clearResults();
  };

  $('pg-run').onclick(); // open with a real trace on screen
})();
