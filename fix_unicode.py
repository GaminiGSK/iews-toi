import re

with open(r'e:\Antigravity\TOI\client\src\pages\FinancialStatements.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacements = {
    'ហិរញ្ញវត្ថ\ufffd': 'ហិរញ្ញវត្ថុ',
    'ចំណូ\ufffd': 'ចំណូល',
    'លក\ufffd': 'លក់',
    'ចំណេញដុ\ufffd': 'ចំណេញដុល',
    'សម្រាប់ឆ្នា\ufffd': 'សម្រាប់ឆ្នាំ',
    'ទ្រព្យសកម្\ufffd': 'ទ្រព្យសកម្ម',
    'មូលធ\ufffdនិ\ufffdបំណុ\ufffd': 'មូលធននិងបំណុល',
    'មូលធ\ufffd': 'មូលធន',
    'បំណុ\ufffd': 'បំណុល',
    'ប្រាក\ufffd': 'ប្រាក់',
    'បង\ufffd': 'បង់',
    'ពន្\ufffd': 'ពន្ធ',
    'វិនិយោ\ufffd': 'វិនិយោគ'
}

count = 0
for k, v in replacements.items():
    if k in text:
        count += text.count(k)
        text = text.replace(k, v)

with open(r'e:\Antigravity\TOI\client\src\pages\FinancialStatements.jsx', 'w', encoding='utf-8') as f:
    f.write(text)

print(f'Done! Replaced {count} instances of corrupted unicode.')
