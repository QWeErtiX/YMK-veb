#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import base64
import json
import os
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

def docx_text(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read('word/document.xml')
    root = ET.fromstring(xml)
    lines = []
    for p in root.iter('{%s}p' % W):
        line = ''.join(t.text or '' for t in p.iter('{%s}t' % W)).strip()
        if line:
            lines.append(line)
    return re.sub(r'\s+', ' ', ' '.join(lines))

def read_lectures(html_path):
    src = open(html_path, encoding='utf-8').read()
    m = re.search(r'var LECTURES = \[(.*?)\];', src, re.DOTALL)
    if not m:
        sys.exit('LECTURES не найден в %s' % html_path)
    items = []
    for mm in re.finditer(r"\{\s*num:\s*'([^']*)',\s*file:\s*'([^']*)',\s*title:\s*'([^']*)'", m.group(1)):
        items.append({'num': mm.group(1), 'file': mm.group(2), 'title': mm.group(3)})
    return items

entries = []
n = 0
for section, html, folder in [
    ('theory', 'theory-reader.html', 'файлы лекций'),
    ('practice', 'practice-reader.html', 'файлы практики'),
]:
    items = read_lectures(os.path.join(ROOT, html))
    for i, item in enumerate(items):
        path = os.path.join(ROOT, folder, item['file'])
        if not os.path.isfile(path):
            print('ПРОПУЩЕН (нет файла):', item['file'])
            continue
        entries.append({'s': section, 'i': i, 'n': item['num'], 't': item['title'], 'x': docx_text(path)})
        n += 1
    print('%s: %d документов' % (html, len(items)))

exam = os.path.join(ROOT, 'файлы контроля', 'Обязательная контрольная работа.docx')
if os.path.isfile(exam):
    entries.append({'s': 'control', 'i': 0, 'n': 'К', 't': 'Контрольная работа', 'x': docx_text(exam)})
    print('control: 1 документ')

out = os.path.join(ROOT, 'js', 'search-index.js')
payload = 'window.SEARCH_INDEX=' + json.dumps(entries, ensure_ascii=False, separators=(',', ':')) + ';\n'
with open(out, 'w', encoding='utf-8', newline='\n') as f:
    f.write(payload)
print('ВСЕГО:', len(entries), 'документов, файл:', out, '%.1f КБ' % (len(payload.encode('utf-8')) / 1024))
