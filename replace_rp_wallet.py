import os
import re

search_dir = "/Users/nilabjodey/rp-wallet-platform"

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return

    pattern = re.compile(r'(?i)\bRP\s*Wallet\b')

    def replacer(match):
        original = match.group(0)
        # Avoid replacing "rp-wallet" to preserve package names, cache keys, and URLs
        if "-" in original:
            return original
        return "LarperWallet"

    new_content = pattern.sub(replacer, content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(search_dir):
    if any(exclude in root for exclude in ['node_modules', '.git', 'dist', 'build', '.next']):
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.html', '.txt')):
            replace_in_file(os.path.join(root, file))

print("Replacement script finished.")
