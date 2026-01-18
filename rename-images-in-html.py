#!/usr/bin/env python3
"""
Update all HTML files to use renamed image files
"""
import os
import re

def update_image_paths(filepath):
    """Update image paths to use -v2 filenames"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False

    original = content

    # Update organoid images
    content = re.sub(r'/organoid1\.png', '/organoid1-v2.png', content)
    content = re.sub(r'/organoid2\.png', '/organoid2-v2.png', content)

    # Update hero images
    content = re.sub(r'/microscopy-hero\.jpg', '/microscopy-hero-v2.jpg', content)
    content = re.sub(r'/biotech-lab-hero\.jpg', '/biotech-lab-hero-v2.jpg', content)
    content = re.sub(r'/brain-organoid-hero\.png', '/brain-organoid-hero-v2.png', content)

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
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                if update_image_paths(filepath):
                    count += 1

    print(f"COMPLETE: Updated image paths in {count} HTML files")

if __name__ == "__main__":
    main()
