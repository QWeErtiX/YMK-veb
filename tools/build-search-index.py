#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read_lectures(html_path, array_name):
    src = open(html_path, encoding='utf-8').read()
    m = re.search(r'var ' + array_name + r' = \[(.*?)\];', src, re.DOTALL)
    if not m:
        sys.exit('%s не найден в %s' % (array_name, html_path))
    items = []
    for mm in re.finditer(r"\{\s*num:\s*'([^']*)',\s*file:\s*'([^']*)',\s*title:\s*'([^']*)'", m.group(1)):
        items.append({'num': mm.group(1), 'file': mm.group(2), 'title': mm.group(3)})
    return items

def read_materials(html_path):
    src = open(html_path, encoding='utf-8').read()
    m = re.search(r'var DOCS = \[(.*?)\];', src, re.DOTALL)
    if not m:
        sys.exit('DOCS не найден в %s' % html_path)
    items = []
    for mm in re.finditer(r"\{\s*num:\s*(\d+),\s*file:\s*'([^']*)',\s*title:\s*'([^']*)'", m.group(1)):
        items.append({'num': mm.group(1), 'file': mm.group(2), 'title': mm.group(3)})
    return items

entries = []
for section, html, array_name in [
    ('theory', 'theory-reader.html', 'LECTURES'),
    ('practice', 'practice-reader.html', 'LECTURES'),
]:
    items = read_lectures(os.path.join(ROOT, html), array_name)
    for i, item in enumerate(items):
        entries.append({'s': section, 'i': i, 'n': item['num'], 't': item['title']})
    print('%s: %d документов' % (html, len(items)))

exam = os.path.join(ROOT, 'файлы контроля', 'Обязательная контрольная работа.docx')
if os.path.isfile(exam):
    entries.append({'s': 'control', 'i': 0, 'n': 'К', 't': 'Контрольная работа'})
    print('control: 1 документ')

items = read_materials(os.path.join(ROOT, 'extra-reader.html'))
for i, item in enumerate(items):
    entries.append({'s': 'extra', 'i': i, 'n': item['num'], 't': item['title']})
print('extra: %d документов' % len(items))

items = read_materials(os.path.join(ROOT, 'note-reader.html'))
for i, item in enumerate(items):
    entries.append({'s': 'note', 'i': i, 'n': item['num'], 't': item['title']})
print('note: %d документа' % len(items))

out = os.path.join(ROOT, 'js', 'search-index.js')
payload = 'window.SEARCH_INDEX=' + json.dumps(entries, ensure_ascii=False, separators=(',', ':')) + ';\n'
with open(out, 'w', encoding='utf-8', newline='\n') as f:
    f.write(payload)
print('ВСЕГО:', len(entries), 'документов, файл:', out, '%.1f КБ' % (len(payload.encode('utf-8')) / 1024))
