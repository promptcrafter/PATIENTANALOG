#!/usr/bin/env python3
"""
Add version comment to ALL files to force complete Cloudflare redeploy
"""
import os

VERSION_COMMENT_HTML = "<!-- v20260117-FULL -->"
VERSION_COMMENT_CSS = "/* v20260117-FULL */"
VERSION_COMMENT_JS = "// v20260117-FULL"

def add_version_to_file(filepath):
    """Add version comment to file based on type"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False

    # Determine comment style based on file extension
    if filepath.endswith('.html'):
        comment = VERSION_COMMENT_HTML
    elif filepath.endswith('.css'):
        comment = VERSION_COMMENT_CSS
    elif filepath.endswith('.js'):
        comment = VERSION_COMMENT_JS
    else:
        return False

    # Check if already has this version
    if comment in content:
        return False

    # Add comment at the end
    if not content.endswith('\n'):
        content += '\n'
    content += comment + '\n'

    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except:
        return False

def main():
    html_count = 0
    css_count = 0
    js_count = 0

    for root, dirs, files in os.walk('.'):
        # Skip hidden and node_modules directories
        dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

        for file in files:
            if file.endswith(('.html', '.css', '.js')):
                filepath = os.path.join(root, file)
                if add_version_to_file(filepath):
                    if file.endswith('.html'):
                        html_count += 1
                    elif file.endswith('.css'):
                        css_count += 1
                    elif file.endswith('.js'):
                        js_count += 1

    print(f"COMPLETE:")
    print(f"  HTML files: {html_count}")
    print(f"  CSS files: {css_count}")
    print(f"  JS files: {js_count}")
    print(f"  TOTAL: {html_count + css_count + js_count}")

if __name__ == "__main__":
    main()
