#!/usr/bin/env python3
"""
Fix image visibility - increase opacity on faded/hidden images
Make all images properly visible, not translucent
"""
import os
import re
from pathlib import Path

def fix_image_opacity(filepath, dry_run=True):
    """Increase opacity on images that are too faded"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        changes = []

        # Pattern 1: Hero images with very low opacity (0.18 - 0.55)
        # Increase to 0.75-0.95 range
        def increase_hero_opacity(match):
            old_opacity = match.group(1)
            new_opacity = min(0.95, float(old_opacity) + 0.35)
            changes.append(f"Hero image opacity: {old_opacity} → {new_opacity}")
            return f'opacity: {new_opacity:.2f}'

        content = re.sub(
            r'opacity:\s*(0\.[1-5][0-9]?)\s*;',
            lambda m: increase_hero_opacity(m) if '<img' in content[max(0, content.find(m.group(0))-500):content.find(m.group(0))] else m.group(0),
            content
        )

        # Pattern 2: Background images in sections (increase from 0.2-0.5 to 0.6-0.85)
        content = re.sub(
            r'(background.*?opacity:\s*)(0\.[1-5][0-9]?)',
            lambda m: m.group(1) + f"{min(0.85, float(m.group(2)) + 0.40):.2f}",
            content
        )

        # Pattern 3: Section images that are barely visible
        content = re.sub(
            r'(<img[^>]*src=[\'"]/assets/images/sections/[^>]*opacity:\s*)(0\.[1-4][0-9]?)',
            lambda m: m.group(1) + "0.75",
            content
        )

        # Pattern 4: Animation keyframes with low opacity
        content = re.sub(
            r'(@keyframes.*?opacity:\s*)(0\.[1-4][0-9]?)(\s*;)',
            lambda m: m.group(1) + f"{min(0.90, float(m.group(2)) + 0.30):.2f}" + m.group(3),
            content,
            flags=re.DOTALL
        )

        if content == original:
            return {'status': 'unchanged'}

        if not dry_run:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return {'status': 'updated', 'changes': changes}
        else:
            return {'status': 'would_update', 'changes': changes}

    except Exception as e:
        return {'status': 'error', 'error': str(e)}

def main(dry_run=True):
    """Main function"""
    root = Path('.')
    index_files = list(root.glob('**/index.html'))

    print(f"Found {len(index_files)} files")
    print(f"Mode: {'DRY RUN (no changes)' if dry_run else 'LIVE UPDATE'}\n")

    results = {'updated': 0, 'would_update': 0, 'unchanged': 0, 'error': 0}

    for filepath in index_files[:100]:  # Start with first 100
        result = fix_image_opacity(filepath, dry_run=dry_run)
        status = result['status']
        results[status] = results.get(status, 0) + 1

        if status in ['updated', 'would_update'] and result.get('changes'):
            print(f"{'WOULD UPDATE' if dry_run else 'UPDATED'}: {filepath}")
            for change in result.get('changes', [])[:3]:
                print(f"  - {change}")

    print(f"\n{'='*60}")
    print(f"RESULTS:")
    print(f"  Updated: {results.get('updated', 0) + results.get('would_update', 0)}")
    print(f"  Unchanged: {results.get('unchanged', 0)}")
    print(f"  Errors: {results.get('error', 0)}")
    print(f"{'='*60}")

if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == '--live':
        print("WARNING: This will UPDATE IMAGE OPACITY!")
        response = input("Make images more visible? Type 'yes': ")
        if response.lower() == 'yes':
            main(dry_run=False)
        else:
            print("Cancelled.")
    else:
        print("Running DRY RUN...\n")
        main(dry_run=True)
