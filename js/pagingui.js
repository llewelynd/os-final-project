/* UI for the page replacement tab and tab switching: validation, frame trace and summary rendering. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var NAMES = { FIFO: 'FIFO', LRU: 'LRU', OPT: 'Optimal' };
  var MAX_REFS = 100;

  var TABS = ['sched', 'paging'];
  function selectTab(name) {
    document.querySelector('.tabs').dataset.active = name;
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

  var FULL = { FIFO: 'FIFO', LRU: 'LRU', OPT: 'Optimal' };
  var ctx = null; // last input, used when a comparison row is picked

  function chipText(algo, refs, n) {
    return FULL[algo] + ' \u00b7 ' + n + ' frame' + (n > 1 ? 's' : '') + ' \u00b7 ' + refs.length + ' references';
  }
  function key(cls, text) {
    var li = el('li', 'key'); li.appendChild(el('i', cls)); li.appendChild(document.createTextNode(text)); return li;
  }

  function renderTrace(algo, refs, n) {
    var out = PageReplacement.run(algo, refs, n);
    var box = $('pg-trace'), table = el('table'), thead = el('thead'), tbody = el('tbody'), hr = el('tr'), r, s;
    $('pg-trace-chip').textContent = chipText(algo, refs, n); $('pg-trace-chip').hidden = false;
    box.className = 'trace' + (refs.length > 30 ? ' dense' : ''); box.innerHTML = '';
    void box.offsetWidth; box.classList.add('play');
    hr.appendChild(el('th', 'row', 'Reference'));
    out.steps.forEach(function (st, i) { var th = el('th', 'pg c' + (st.page % 10), st.page); th.title = 'Step ' + (i + 1); hr.appendChild(th); });
    thead.appendChild(hr); table.appendChild(thead);
    for (s = 0; s < n; s++) {
      r = el('tr'); r.appendChild(el('th', 'row', 'Frame ' + (s + 1)));
      out.steps.forEach(function (st) {
        var v = st.frames[s], td = el('td', v === null ? 'cell blank' : 'cell c' + (v % 10), v === null ? '' : v);
        if (st.loadedIn === s) td.classList.add('new');
        r.appendChild(td);
      });
      tbody.appendChild(r);
    }
    r = el('tr'); r.appendChild(el('th', 'row', 'Result'));
    out.steps.forEach(function (st) { r.appendChild(el('td', 'res ' + (st.hit ? 'hit' : 'fault'), st.hit ? 'Hit' : 'Fault')); });
    tbody.appendChild(r);
    r = el('tr', 'ev'); r.appendChild(el('th', 'row', 'Evicted'));
    out.steps.forEach(function (st) { r.appendChild(el('td', 'evc', st.replaced === null ? '\u2013' : st.replaced)); });
    tbody.appendChild(r);
    table.appendChild(tbody); box.appendChild(table);

    var lg = $('pg-legend'), seen = [];
    lg.innerHTML = ''; lg.hidden = false;
    refs.forEach(function (p) { if (seen.indexOf(p) < 0) seen.push(p); });
    seen.slice(0, 12).forEach(function (p) { lg.appendChild(el('li', 'sw c' + (p % 10), p)); });
    lg.appendChild(key('k-new', 'Just loaded')); lg.appendChild(key('k-hit', 'Hit'));
    lg.appendChild(key('k-fault', 'Fault')); lg.appendChild(key('k-ev', 'Page evicted'));
  }

  function pct(x) { return (x * 100).toFixed(1) + '%'; }

  function stat(cls, label, value, sub, ratio) {
    var d = el('div', 'stat ' + cls);
    d.appendChild(el('span', 'lab', label)); d.appendChild(el('b', '', value));
    if (ratio === undefined) d.appendChild(el('small', '', sub));
    else { var bar = el('div', 'bar'), f = el('i'); f.style.width = (ratio * 100) + '%'; bar.appendChild(f); d.appendChild(bar); }
    return d;
  }

  function renderSummary(out, algo, refs, n) {
    var box = $('pg-summary'), grid = el('div', 'stats four'), of = 'of ' + refs.length + ' references';
    box.className = ''; box.innerHTML = '';
    box.appendChild(el('p', 'runline', chipText(algo, refs, n)));
    grid.appendChild(stat('fault', 'Page faults', out.faults, of));
    grid.appendChild(stat('hit', 'Hits', out.hits, of));
    grid.appendChild(stat('fault', 'Fault ratio', pct(out.faultRatio), '', out.faultRatio));
    grid.appendChild(stat('hit', 'Hit ratio', pct(out.hitRatio), '', out.hitRatio));
    box.appendChild(grid);
  }

  function renderCompare(refs, n, selected) {
    var box = $('pg-summary'), algos = ['FIFO', 'LRU', 'OPT'];
    var rows = algos.map(function (a) { return { a: a, o: PageReplacement.run(a, refs, n) }; });
    var min = Math.min.apply(null, rows.map(function (x) { return x.o.faults; }));
    var card = el('article', 'card'), wrap = el('div', 'scroll'), table = el('table', 'data cmp'), head = el('thead'), hr = el('tr'), body = el('tbody');
    box.className = ''; box.innerHTML = '';
    card.appendChild(el('h2', '', 'Comparison'));
    ['Algorithm', 'Faults', 'Hits', 'Fault ratio', 'Hit ratio'].forEach(function (h) { hr.appendChild(el('th', '', h)); });
    head.appendChild(hr); table.appendChild(head);
    rows.forEach(function (x) {
      var tr = el('tr', (x.o.faults === min ? 'best ' : '') + (x.a === selected ? 'sel' : '')), first = el('td', '', FULL[x.a]);
      if (x.o.faults === min) first.appendChild(el('span', 'badge', 'Fewest faults'));
      tr.appendChild(first);
      [x.o.faults, x.o.hits, pct(x.o.faultRatio), pct(x.o.hitRatio)].forEach(function (v) { tr.appendChild(el('td', '', v)); });
      tr.tabIndex = 0; tr.title = 'Show the frame trace for ' + FULL[x.a];
      var pick = function () { renderCompare(refs, n, x.a); renderTrace(x.a, refs, n); };
      tr.onclick = pick; tr.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } };
      body.appendChild(tr);
    });
    table.appendChild(body); wrap.appendChild(table); card.appendChild(wrap);
    card.appendChild(el('p', 'note', 'Select a row to show its frame trace below. ' + n + ' frame' + (n > 1 ? 's' : '') + ', ' + refs.length + ' references.'));
    box.appendChild(card);
  }

  function clearResults() {
    $('pg-summary').className = 'empty'; $('pg-summary').textContent = 'Run a simulation to see the results.';
    $('pg-trace').className = 'trace empty'; $('pg-trace').textContent = 'Run a simulation to see each step.';
    $('pg-trace-chip').hidden = true; $('pg-legend').hidden = true;
  }

  $('pg-run').onclick = function () {
    var r = readInput(); showErrors(r.errs);
    if (r.errs.length) { clearResults(); return; }
    var algo = $('pg-algo').value;
    renderSummary(PageReplacement.run(algo, r.refs, r.frames), algo, r.refs, r.frames);
    renderTrace(algo, r.refs, r.frames);
  };

  $('pg-compare').onclick = function () {
    var r = readInput(); showErrors(r.errs);
    if (r.errs.length) { clearResults(); return; }
    var algo = $('pg-algo').value;
    renderCompare(r.refs, r.frames, algo);
    renderTrace(algo, r.refs, r.frames);
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
