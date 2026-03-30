import os
import re

def find_unused():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if not file.endswith(('.ts', '.tsx')): continue
            path = os.path.join(root, file)
            try:
                with open(path, 'r') as f:
                    content = f.read()
            except:
                continue

            # Match named imports
            matches = re.finditer(r'import\s+\{([^}]+)\}\s+from', content)
            for match in matches:
                items = [i.strip() for i in match.group(1).split(',')]
                for item in items:
                    if not item: continue
                    name = item.split(' as ')[-1].strip()
                    # Count occurrences of the name as a whole word
                    count = len(re.findall(r'\b' + re.escape(name) + r'\b', content))
                    if count == 1:
                        print(f"Unused: {name} in {path}")

find_unused()
