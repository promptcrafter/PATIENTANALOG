#!/usr/bin/env python3
"""
Add canonical tags to all pages in /pages/ folder
CAREFUL: Do NOT remove any AdSense tags
"""
import os
import re
from pathlib import Path

def add_canonical_tag(filepath):
    """Add canonical tag if missing, preserve all AdSense tags"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if canonical tag already exists
        if 'rel="canonical"' in content or "rel='canonical'" in content:
            return {'status': 'has_canonical', 'file': filepath}

        # Build the canonical URL from the file path
        # Convert: pages/science/pancreatic-organoids/index.html
        # To: https://patientanalog.com/pages/science/pancreatic-organoids/

        rel_path = str(filepath).replace('\\', '/')
        rel_path = rel_path.replace('C:/Users/josep/Desktop/COMPLETE-FINAL-JAN17-2026/', '')
        rel_path = rel_path.replace('/index.html', '/')

        canonical_url = f'https://patientanalog.com/{rel_path}'

        # Create the canonical tag
        canonical_tag = f'  <link rel="canonical" href="{canonical_url}">\n'

        # Find where to insert (after last meta tag in head, before title or first link)
        # Look for patterns like: </title>, <link, <script

        # Find the position after the last <meta> tag
        meta_positions = [m.end() for m in re.finditer(r'<meta[^>]*>', content)]

        if meta_positions:
            # Insert after the last meta tag
            insert_pos = meta_positions[-1]

            # Find the end of the line
            newline_pos = content.find('\n', insert_pos)
            if newline_pos != -1:
                insert_pos = newline_pos + 1

            # Insert the canonical tag
            new_content = content[:insert_pos] + canonical_tag + content[insert_pos:]

            # Verify we didn't remove anything
            if 'google-adsense-account' in content:
                if 'google-adsense-account' not in new_content:
                    return {'status': 'error', 'error': 'AdSense tag would be removed!', 'file': filepath}

            # Write the file
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

            return {'status': 'added', 'file': filepath, 'url': canonical_url}
        else:
            return {'status': 'no_meta_tags', 'file': filepath}

    except Exception as e:
        return {'status': 'error', 'error': str(e), 'file': filepath}

def main():
    """Add canonical tags to all pages in /pages/ folder"""
    root = Path('pages')
    html_files = list(root.glob('**/index.html'))

    print(f"Found {len(html_files)} files in /pages/ folder\n")

    results = {'added': 0, 'has_canonical': 0, 'error': 0, 'no_meta_tags': 0}

    for filepath in html_files:
        result = add_canonical_tag(filepath)
        status = result['status']
        results[status] = results.get(status, 0) + 1

        if status == 'added':
            print(f"ADDED: {result['url']}")
        elif status == 'error':
            print(f"ERROR: {filepath} - {result.get('error', 'Unknown')}")

    print(f"\n{'='*60}")
    print(f"Results:")
    print(f"  Canonical tags added: {results['added']}")
    print(f"  Already had canonical: {results['has_canonical']}")
    print(f"  No meta tags found: {results['no_meta_tags']}")
    print(f"  Errors: {results['error']}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
