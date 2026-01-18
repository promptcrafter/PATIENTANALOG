#!/usr/bin/env python3
"""
Add cache-busting query parameters to all organoid and hero image URLs
"""
import os
import re

VERSION = "v=20260117"

def add_cache_busting(filepath):
    """Add version parameter to image URLs"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False

    original = content

    # Add ?v= to organoid images if not already present
    content = re.sub(
        r'src="/assets/images/organoids/(organoid[12]\.png)"(?!\?v=)',
        rf'src="/assets/images/organoids/\1?{VERSION}"',
        content
    )

    # Add ?v= to hero images if not already present
    content = re.sub(
        r'src="/assets/images/hero/([^"]+\.(?:jpg|png))"(?!\?v=)',
        rf'src="/assets/images/hero/\1?{VERSION}"',
        content
    )

    # Add ?v= to multi-organ-chips if not already present
    content = re.sub(
        r'src="/assets/images/(multi-organ-chips\.png)"(?!\?v=)',
        rf'src="/assets/images/\1?{VERSION}"',
        content
    )

    if content != original:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except:
            return False

    return False

def main():
    count = 0

    for root, dirs, files in os.walk('.'):
        # Skip hidden and node_modules directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                if add_cache_busting(filepath):
                    count += 1
                    if count % 50 == 0:
                        print(f"Processed {count} files...")

    print(f"\nCOMPLETE: Added cache-busting to {count} HTML files")

if __name__ == "__main__":
    main()
