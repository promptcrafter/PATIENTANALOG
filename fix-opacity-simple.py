#!/usr/bin/env python3
"""
Fix image opacity - increase visibility on faded images
"""
import os
import re
from pathlib import Path

def fix_opacity(filepath, dry_run=True):
    """Increase opacity on faded images"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        original = content
        changes = 0

        # Pattern 1: Find opacity values below 0.75 and increase them MORE
        def increase_opacity(match):
            nonlocal changes
            old_val = float(match.group(1))
            if old_val < 0.75:
                new_val = min(0.90, old_val + 0.25)
                changes += 1
                return f'opacity: {new_val:.2f}'
            return match.group(0)

        # Fix inline style opacity
        content = re.sub(
            r'opacity:\s*(0\.\d+)',
            increase_opacity,
            content
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
    html_files = list(root.glob('**/index.html'))

    print(f"Found {len(html_files)} files")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE UPDATE'}\n")

    results = {'updated': 0, 'would_update': 0, 'unchanged': 0, 'error': 0}

    for filepath in html_files:  # Process all files
        result = fix_opacity(filepath, dry_run=dry_run)
        status = result['status']
        results[status] = results.get(status, 0) + 1

        if status in ['updated', 'would_update'] and result.get('changes'):
            mode = 'WOULD UPDATE' if dry_run else 'UPDATED'
            print(f"{mode}: {filepath} ({result['changes']} changes)")

    print(f"\n{'='*50}")
    print(f"Updated: {results.get('updated', 0) + results.get('would_update', 0)}")
    print(f"Unchanged: {results.get('unchanged', 0)}")
    print(f"Errors: {results.get('error', 0)}")
    print(f"{'='*50}")

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
        main(dry_run=True)
