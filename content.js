(function() {
  // Only run on ShiftController4 pages
  if (!location.pathname.includes('/wp-admin/admin.php')) return;
  if (!location.search.includes('page=shiftcontroller4')) return;

  function getSettings(callback) {
    chrome.storage.sync.get(['holidays', 'bgColor', 'enabled'], function(data) {
      callback({
        holidays: data.holidays || [],
        bgColor: data.bgColor || '#FFD700',
        enabled: data.enabled !== false
      });
    });
  }

  function extractDateFromHref(href) {
    var match = href.match(/start\/([0-9]{8})/);
    return match ? match[1] : null;
  }

  function removeHighlights() {
    document.querySelectorAll('[data-sc-holiday="1"]').forEach(function(el) {
      el.style.backgroundColor = '';
      el.removeAttribute('data-sc-holiday');
    });
  }

  function highlightHolidayColumns(holidays, bgColor) {
    var holidaySet = new Set(holidays);
    var columnIndexesToHighlight = new Set();

    // Find all header links with dates matching holidays
    document.querySelectorAll('a[href*="shiftcontroller4"][href*="start/"]').forEach(function(link) {
      var dateStr = extractDateFromHref(link.href || '');
      if (!dateStr || !holidaySet.has(dateStr)) return;

      var cell = link.closest('.hc-table-cell');
      if (!cell) return;
      var row = cell.parentElement;
      if (!row) return;

      var siblings = Array.from(row.children).filter(function(el) {
        return el.classList.contains('hc-table-cell');
      });
      var colIndex = siblings.indexOf(cell);
      if (colIndex >= 0) columnIndexesToHighlight.add(colIndex);
    });

    if (columnIndexesToHighlight.size === 0) return;

    // Highlight matching column in every row
    document.querySelectorAll('.hc-table-row').forEach(function(row) {
      var cells = Array.from(row.children).filter(function(el) {
        return el.classList.contains('hc-table-cell');
      });
      columnIndexesToHighlight.forEach(function(colIndex) {
        if (cells[colIndex]) {
          cells[colIndex].style.backgroundColor = bgColor;
          cells[colIndex].setAttribute('data-sc-holiday', '1');
        }
      });
    });
  }

  function run() {
    getSettings(function(settings) {
      removeHighlights();
      if (!settings.enabled || settings.holidays.length === 0) return;
      highlightHolidayColumns(settings.holidays, settings.bgColor);
    });
  }

  // Initial run
  run();

  // Listen for refresh from popup
  chrome.runtime.onMessage.addListener(function(msg) {
    if (msg.action === 'refresh') run();
  });

  // Watch for dynamic DOM changes (ShiftController uses AJAX)
  var debounceTimer = null;
  new MutationObserver(function(mutations) {
    var relevant = mutations.some(function(m) { return m.addedNodes.length > 0; });
    if (!relevant) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(run, 400);
  }).observe(document.body, { childList: true, subtree: true });

})();
