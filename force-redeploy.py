#!/usr/bin/env python3
"""
Add version comment to all HTML files to force Cloudflare to see them as changed
"""
import os
import re

VERSION_COMMENT = "<!-- v20260117-COMPLETE-REDEPLOY -->"

def add_version_to_html(filepath):
    """Add version comment to end of HTML file if not already present"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        print(f"ERROR: Could not read {filepath}")
        return False

    # Check if already has this version comment
    if VERSION_COMMENT in content:
        return False

    # Add comment at the end
    if not content.endswith('\n'):
        content += '\n'
    content += VERSION_COMMENT + '\n'

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except:
        print(f"ERROR: Could not write {filepath}")
        return False

def main():
    count = 0
    for root, dirs, files in os.walk('.'):
        # Skip hidden and node_modules directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                if add_version_to_html(filepath):
                    count += 1
                    if count % 50 == 0:
                        print(f"Processed {count} files...")

    print(f"\nTOTAL: Added version comment to {count} HTML files")

if __name__ == "__main__":
    main()
