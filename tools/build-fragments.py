#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Универсальная пересборка встроенных документов ЭУМК в JS-фрагменты (base64).

Использование:
    python3 tools/build-fragments.py [html] [папка_с_docx] [папка_для_js]

По умолчанию — лекции:
    python3 tools/build-fragments.py
    python3 tools/build-fragments.py theory-reader.html "файлы лекций" js/lectures
Практика:
    python3 tools/build-fragments.py practice-reader.html "файлы практики" js/practice
"""
import re
import os
import base64
import json
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

html_name = sys.argv[1] if len(sys.argv) > 1 else 'theory-reader.html'
docx_name = sys.argv[2] if len(sys.argv) > 2 else 'файлы лекций'
out_name  = sys.argv[3] if len(sys.argv) > 3 else 'js/lectures'

SRC_HTML = os.path.join(ROOT, html_name)
DOCX_DIR = os.path.join(ROOT, docx_name)
OUT_DIR  = os.path.join(ROOT, out_name)

src = open(SRC_HTML, encoding='utf-8').read()
pairs = re.findall(r'data-file="([^"]+)" data-idx="(\d+)"', src)
if not pairs:
    sys.exit('Не найдено ни одной пары data-file/data-idx в %s' % html_name)

os.makedirs(OUT_DIR, exist_ok=True)

index_map = {}
missing = []
for fname, idx in pairs:
    idx = int(idx)
    path = os.path.join(DOCX_DIR, fname)
    if not os.path.isfile(path):
        missing.append(fname)
        continue
    with open(path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('ascii')
    frag = (
        'window.LECTURE_FILES=window.LECTURE_FILES||{};'
        'window.LECTURE_FILES[' + json.dumps(fname, ensure_ascii=False) + ']="' + b64 + '";\n'
    )
    with open(os.path.join(OUT_DIR, 'lec-%d.js' % idx), 'w', encoding='utf-8') as f:
        f.write(frag)
    index_map[fname] = idx

with open(os.path.join(OUT_DIR, 'index.js'), 'w', encoding='utf-8') as f:
    f.write('window.LECTURE_INDEX=' + json.dumps(index_map, ensure_ascii=False, indent=1) + ';\n')

total = sum(os.path.getsize(os.path.join(OUT_DIR, n)) for n in os.listdir(OUT_DIR) if n.startswith('lec-'))
print('Готово: %d фрагментов, %d КБ суммарно' % (len(index_map), total // 1024))
if missing:
    sys.exit('Отсутствуют файлы: %s' % ', '.join(missing))
