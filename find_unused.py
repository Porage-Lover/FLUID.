import os
import re

def check_file(path):
    try:
        with open(path, 'r') as f:
            content = f.read()
    except:
        return

    # named imports
    matches = re.finditer(r'import\s+\{([^}]+)\}\s+from\s+[\'"]([^\'"]+)[\'"]', content)
    for match in matches:
        imports = match.group(1).split(',')
        for imp in imports:
            imp = imp.strip()
            if not imp: continue

            if ' as ' in imp:
                name = imp.split(' as ')[1].strip()
            else:
                name = imp.strip()

            occurrences = re.findall(r'\b' + re.escape(name) + r'\b', content)
            if len(occurrences) < 2:
                print(f"Unused import '{name}' in {path}")

    # default imports
    matches = re.finditer(r'import\s+([a-zA-Z0-9_]+)\s+from\s+[\'"]([^\'"]+)[\'"]', content)
    for match in matches:
        name = match.group(1)
        if name in ['React']: continue # Often imported but used implicitly in older patterns, though here we have react-jsx
        occurrences = re.findall(r'\b' + re.escape(name) + r'\b', content)
        if len(occurrences) < 2:
            print(f"Unused default import '{name}' in {path}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            check_file(os.path.join(root, file))
