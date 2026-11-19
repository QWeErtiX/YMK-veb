
window.fixVariantTables = function (html) {
  if (!html || html.indexOf('<table') === -1) return html;
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var tables = tmp.querySelectorAll('table');
  for (var t = 0; t < tables.length; t++) {
    var table = tables[t];
    var rows = table.rows;
    if (!rows || rows.length < 2) continue;
    var headerCell = rows[0].cells[0];
    if (!headerCell) continue;
    if (!/^\s*вариант/i.test(headerCell.textContent || '')) continue;
    for (var r = 1; r < rows.length; r++) {
      var cell = rows[r].cells[0];
      if (!cell) continue;
      var text = (cell.textContent || '').trim();
      var hasMedia = cell.querySelector('img, svg, canvas, object, iframe, math');
      if (text || hasMedia) continue;
      cell.innerHTML = String(r);
      cell.className = ((cell.className || '') + ' variant-cell').trim();
      cell.style.textAlign = 'center';
      cell.style.fontWeight = '700';
    }
  }
  return tmp.innerHTML;
};
