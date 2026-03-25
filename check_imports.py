import re

def find_unused_imports(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    import_matches = re.finditer(r"import \{([^}]+)\} from '([^']+)';", content)
    results = []
    for match in import_matches:
        imports_str = match.group(1)
        source = match.group(2)
        imports = [i.strip() for i in imports_str.split(',')]
        for imp in imports:
            if not imp: continue
            # Handle "A as B"
            name = imp.split(' as ')[-1]
            # Search for name in content, excluding the import line
            # We just count occurrences and expect > 1
            count = len(re.findall(r'\b' + name + r'\b', content))
            if count == 1:
                results.append((name, source))
    return results

print(find_unused_imports('src/components/BottomWavePlayer.tsx'))
