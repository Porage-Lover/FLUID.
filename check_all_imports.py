import re
import os

def find_unused_imports(filepath):
    with open(filepath, 'r') as f:
        try:
            content = f.read()
        except:
            return []

    # Matches: import { A, B } from 'source';
    import_matches = re.finditer(r"import \{([^}]+)\} from '([^']+)';", content)
    results = []
    for match in import_matches:
        imports_str = match.group(1)
        source = match.group(2)
        imports = [i.strip() for i in imports_str.split(',')]
        for imp in imports:
            if not imp: continue
            name = imp.split(' as ')[-1].strip()
            # Simple word boundary check
            count = len(re.findall(r'\b' + name + r'\b', content))
            if count == 1:
                results.append((name, source))
    return results

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            path = os.path.join(root, file)
            unused = find_unused_imports(path)
            if unused:
                print(f"{path}: {unused}")
