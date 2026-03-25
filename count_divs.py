#!/usr/bin/env python3
path = 'fix_page2.py'
with open(path, encoding='utf-8') as f:
    content = f.read()
marker = 'NEW = """'
start = content.index(marker) + len(marker)
end = content.index('"""', start)
new_block = content[start:end]
opens = new_block.count('<div')
closes = new_block.count('</div')
print(f'New block: opens={opens}, closes={closes}, net={opens-closes}')
print('Last 5 lines of new block:')
for l in new_block.strip().split('\n')[-5:]:
    print(repr(l))
