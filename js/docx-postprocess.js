/*
 * Пост-обработка HTML, сгенерированного mammoth (docx → HTML).
 *
 * Mammoth отбрасывает автоматическую нумерацию Word в пустых абзацах
 * списков (<w:numPr> без <w:r>), поэтому в вариантных таблицах лабораторных
 * и контрольных работ («Вариант | Задание») ячейки с номерами вариантов
 * оказывались пустыми. Word вычисляет эти номера сам, в исходных .docx
 * ничего не потеряно.
 *
 * fixVariantTables(html) — строка → строка: находит таблицы, где заголовок
 * первой ячейки первой строки начинается с «Вариант», и проставляет
 * порядковые номера (1..N) в пустые первые ячейки последующих строк.
 * Ячейки с текстом или изображениями не трогаются. Нумерация — по порядку
 * строк данных (строка данных № 1 → «1», № 2 → «2» и т. д.).
 */
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
      if (text || hasMedia) continue; // ячейка заполнена — не трогаем
      cell.innerHTML = String(r); // нумерация по порядку строк данных (заголовок не считаем)
      cell.className = ((cell.className || '') + ' variant-cell').trim();
      cell.style.textAlign = 'center';
      cell.style.fontWeight = '700';
    }
  }
  return tmp.innerHTML;
};
