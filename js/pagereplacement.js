/* Page replacement algorithms. Pure functions, no DOM access.
 * Input:  refs = [page numbers/ids], frames = number of frames (integer >= 1)
 * Output: { steps: [{page, frames: [page|null], hit, replaced, loadedIn}],
 *           faults, hits, hitRatio, faultRatio }
 * frames[] keeps fixed slots, so a replaced page is overwritten in place.
 * `replaced` is the evicted page (or null); `loadedIn` is the slot index just written (or -1 on a hit). */
(function (root) {
  'use strict';

  // Shared simulation loop; victim(ctx) returns the slot index to evict when all frames are full.
  function simulate(refs, nFrames, hooks) {
    var slots = [], steps = [], faults = 0, i, s;
    for (s = 0; s < nFrames; s++) slots.push(null);
    var state = hooks.init(nFrames);

    for (i = 0; i < refs.length; i++) {
      var page = refs[i], at = slots.indexOf(page), hit = at !== -1, replaced = null, loaded = -1;
      if (hit) {
        hooks.onHit(state, at, i);
      } else {
        faults++;
        var free = slots.indexOf(null);
        if (free !== -1) loaded = free;
        else {
          loaded = hooks.victim(state, slots, refs, i);
          replaced = slots[loaded];
        }
        slots[loaded] = page;
        hooks.onLoad(state, loaded, i);
      }
      steps.push({ page: page, frames: slots.slice(), hit: hit, replaced: replaced, loadedIn: loaded });
    }
    var n = refs.length || 1;
    return {
      steps: steps, faults: faults, hits: refs.length - faults,
      hitRatio: (refs.length - faults) / n, faultRatio: faults / n
    };
  }

  // FIFO: evict the page that has been in memory the longest. Hits do not change order.
  function fifo(refs, nFrames) {
    return simulate(refs, nFrames, {
      init: function () { return { loadedAt: [] }; },
      onHit: function () {},
      onLoad: function (st, slot, t) { st.loadedAt[slot] = t; },
      victim: function (st, slots) {
        var best = 0;
        for (var s = 1; s < slots.length; s++) if (st.loadedAt[s] < st.loadedAt[best]) best = s;
        return best;
      }
    });
  }

  // LRU: evict the page whose most recent use is the oldest. Hits refresh the page.
  function lru(refs, nFrames) {
    return simulate(refs, nFrames, {
      init: function () { return { lastUsed: [] }; },
      onHit: function (st, slot, t) { st.lastUsed[slot] = t; },
      onLoad: function (st, slot, t) { st.lastUsed[slot] = t; },
      victim: function (st, slots) {
        var best = 0;
        for (var s = 1; s < slots.length; s++) if (st.lastUsed[s] < st.lastUsed[best]) best = s;
        return best;
      }
    });
  }

  // Optimal (Belady): evict the page whose next use is farthest in the future.
  // Pages never used again are evicted first; ties go to the lowest slot index.
  function optimal(refs, nFrames) {
    return simulate(refs, nFrames, {
      init: function () { return {}; },
      onHit: function () {},
      onLoad: function () {},
      victim: function (st, slots, all, now) {
        var best = 0, bestDist = -1;
        for (var s = 0; s < slots.length; s++) {
          var next = all.indexOf(slots[s], now + 1);
          var dist = next === -1 ? Infinity : next;
          if (dist > bestDist) { bestDist = dist; best = s; }
        }
        return best;
      }
    });
  }

  function run(algo, refs, nFrames) {
    if (algo === 'FIFO') return fifo(refs, nFrames);
    if (algo === 'LRU') return lru(refs, nFrames);
    if (algo === 'OPT') return optimal(refs, nFrames);
    throw new Error('Unknown page replacement algorithm: ' + algo);
  }

  var api = { fifo: fifo, lru: lru, optimal: optimal, run: run };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PageReplacement = api;
})(typeof window !== 'undefined' ? window : this);
